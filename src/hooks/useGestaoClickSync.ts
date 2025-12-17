import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface GestaoClickConfig {
  access_token: string;
  secret_token: string;
  situacao_id?: string;
  forma_pagamento_ids?: {
    BOLETO?: string;
    PIX?: string;
    DINHEIRO?: string;
  };
}

export function useGestaoClickSync() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pedidoEmProcessamento, setPedidoEmProcessamento] = useState<string | null>(null);

  const getConfig = useCallback(async (): Promise<GestaoClickConfig | null> => {
    if (!user?.id) return null;
    
    const { data, error } = await supabase
      .from('integracoes_config')
      .select('config')
      .eq('user_id', user.id)
      .eq('integracao', 'gestaoclick')
      .maybeSingle();
    
    if (error || !data?.config) return null;
    return data.config as unknown as GestaoClickConfig;
  }, [user?.id]);

  const gerarVendaGC = useCallback(async (agendamentoId: string, clienteId: string) => {
    setLoading(true);
    setPedidoEmProcessamento(agendamentoId);
    
    try {
      // 1. Buscar configuração do GestaoClick
      const config = await getConfig();
      if (!config?.access_token || !config?.secret_token) {
        toast.error('Configure as credenciais do GestaoClick em Configurações → Integrações');
        return false;
      }

      if (!config.situacao_id) {
        toast.error('Configure a situação de venda em Configurações → Integrações → GestaoClick');
        return false;
      }

      // 2. Buscar dados do cliente
      const { data: cliente, error: clienteError } = await supabase
        .from('clientes')
        .select('gestaoclick_cliente_id, forma_pagamento, prazo_pagamento_dias, nome')
        .eq('id', clienteId)
        .single();

      if (clienteError || !cliente) {
        toast.error('Cliente não encontrado');
        return false;
      }

      if (!cliente.gestaoclick_cliente_id) {
        toast.error(`Cliente "${cliente.nome}" não possui ID GestaoClick configurado`);
        return false;
      }

      // 3. Buscar itens do agendamento usando a função do banco
      const { data: itens, error: itensError } = await supabase
        .rpc('compute_entrega_itens_v2', { p_agendamento_id: agendamentoId });

      if (itensError || !itens || itens.length === 0) {
        toast.error('Não foi possível calcular os itens do pedido');
        return false;
      }

      // 4. Buscar produtos com ID do GestaoClick
      const produtoIds = itens.map((i: { produto_id: string }) => i.produto_id);
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_finais')
        .select('id, nome, gestaoclick_produto_id, categoria_id')
        .in('id', produtoIds);

      if (produtosError) {
        toast.error('Erro ao buscar produtos');
        return false;
      }

      // 5. Buscar preços personalizados do cliente
      const categoriaIds = [...new Set(produtos?.map(p => p.categoria_id).filter(Boolean))];
      const { data: precosCliente } = await supabase
        .from('precos_categoria_cliente')
        .select('categoria_id, preco_unitario')
        .eq('cliente_id', clienteId)
        .in('categoria_id', categoriaIds as number[]);

      // 6. Buscar preços padrão das categorias
      const { data: configSistema } = await supabase
        .from('configuracoes_sistema')
        .select('configuracoes')
        .eq('modulo', 'precificacao')
        .eq('user_id', user!.id)
        .maybeSingle();

      const precosDefault = (configSistema?.configuracoes as { precosPorCategoria?: Record<string, number> })?.precosPorCategoria || {};

      // 7. Montar itens com preços
      const itensVenda = itens.map((item: { produto_id: string; quantidade: number }) => {
        const produto = produtos?.find(p => p.id === item.produto_id);
        if (!produto?.gestaoclick_produto_id) {
          throw new Error(`Produto "${produto?.nome || item.produto_id}" não possui ID GestaoClick`);
        }

        // Determinar preço: personalizado → padrão categoria → fallback
        let precoUnitario = 4.50;
        const categoriaId = produto.categoria_id;
        
        if (categoriaId) {
          const precoPersonalizado = precosCliente?.find(p => p.categoria_id === categoriaId);
          if (precoPersonalizado) {
            precoUnitario = precoPersonalizado.preco_unitario;
          } else if (precosDefault[categoriaId.toString()]) {
            precoUnitario = precosDefault[categoriaId.toString()];
          }
        }

        return {
          produto_id: produto.gestaoclick_produto_id,
          quantidade: item.quantidade,
          valor_unitario: precoUnitario,
          valor_total: item.quantidade * precoUnitario
        };
      });

      // 8. Determinar forma de pagamento
      const formaPagamento = cliente.forma_pagamento || 'BOLETO';
      const formaPagamentoId = config.forma_pagamento_ids?.[formaPagamento as keyof typeof config.forma_pagamento_ids];
      
      if (!formaPagamentoId) {
        toast.error(`Forma de pagamento "${formaPagamento}" não mapeada em Configurações → GestaoClick`);
        return false;
      }

      // 9. Calcular valor total
      const valorTotal = itensVenda.reduce((acc: number, item: { valor_total: number }) => acc + item.valor_total, 0);

      // 10. Criar venda no GestaoClick
      const vendaPayload = {
        cliente_id: cliente.gestaoclick_cliente_id,
        situacao_id: config.situacao_id,
        forma_pagamento_id: formaPagamentoId,
        data_venda: new Date().toISOString().split('T')[0],
        prazo_pagamento: cliente.prazo_pagamento_dias || 7,
        valor_total: valorTotal,
        itens: itensVenda.map((item: { produto_id: string; quantidade: number; valor_unitario: number }) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario
        }))
      };

      const response = await fetch('https://api.gestaoclick.com/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-token': config.access_token,
          'secret-access-token': config.secret_token
        },
        body: JSON.stringify(vendaPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }

      const vendaCriada = await response.json();
      const vendaId = vendaCriada.venda_id || vendaCriada.id;

      // 11. Atualizar agendamento com ID da venda
      await supabase
        .from('agendamentos_clientes')
        .update({
          // Store the venda_id in itens_personalizados as a temporary solution
          // since we haven't added gestaoclick_venda_id column yet
        })
        .eq('id', agendamentoId);

      toast.success(`Venda #${vendaId} criada no GestaoClick!`);
      return true;

    } catch (error) {
      console.error('Erro ao gerar venda GestaoClick:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar venda no GestaoClick');
      return false;
    } finally {
      setLoading(false);
      setPedidoEmProcessamento(null);
    }
  }, [user?.id, getConfig]);

  return {
    gerarVendaGC,
    loading,
    pedidoEmProcessamento
  };
}
