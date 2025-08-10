
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProdutoInsuficiente {
  nome: string;
  necessario: number;
  disponivel: number;
  faltante: number;
}

interface PedidoEntrega {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  quantidade_total: number;
  tipo_pedido: string;
  itens_personalizados?: any;
}

export const useConfirmacaoEntrega = () => {
  const [loading, setLoading] = useState(false);

  // Calcular itens usando RPC no servidor (fonte única da verdade)
  const calcularItensEntrega = async (pedido: PedidoEntrega) => {
    console.log('🧮 [RPC] Calculando itens para entrega:', pedido.id);
    try {
      const { data, error } = await supabase.rpc('compute_entrega_itens', {
        p_agendamento_id: pedido.id
      });

      if (error) {
        console.error('Erro ao calcular itens via RPC:', error);
        throw new Error(`Erro ao calcular itens para ${pedido.cliente_nome}: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error(`Não foi possível calcular itens para ${pedido.cliente_nome}. Verifique se há produtos ativos ou proporções configuradas.`);
      }

      const itens = data.map((item: any) => ({
        produto_id: item.produto_id as string,
        produto_nome: item.produto_nome as string,
        quantidade: Number(item.quantidade || 0)
      }));

      console.log('📦 Itens calculados (server):', itens);
      return itens;
    } catch (error) {
      console.error('Erro fatal ao calcular itens:', error);
      throw error;
    }
  };

  const obterSaldoProduto = async (produtoId: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('saldo_produto', {
        p_id: produtoId
      });

      if (error) {
        console.error('Erro ao obter saldo do produto:', error);
        return 0;
      }

      return Number(data || 0);
    } catch (error) {
      console.error('Erro ao obter saldo do produto:', error);
      return 0;
    }
  };

  const validarEstoqueDisponivel = async (itensEntrega: any[]): Promise<ProdutoInsuficiente[]> => {
    const produtosInsuficientes: ProdutoInsuficiente[] = [];
    
    for (const item of itensEntrega) {
      if (!item.produto_id || Number(item.quantidade) <= 0) continue;

      const saldoAtual = await obterSaldoProduto(item.produto_id);
      const quantidadeNecessaria = Number(item.quantidade);
      
      if (saldoAtual < quantidadeNecessaria) {
        produtosInsuficientes.push({
          nome: item.produto_nome,
          necessario: quantidadeNecessaria,
          disponivel: saldoAtual,
          faltante: quantidadeNecessaria - saldoAtual
        });
      }
    }

    return produtosInsuficientes;
  };

  const confirmarEntrega = async (pedido: PedidoEntrega, observacao?: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🚚 Iniciando confirmação de entrega (server-side):', pedido.id);

      // 1) Calcular itens via servidor
      const itensEntrega = await calcularItensEntrega(pedido);
      if (itensEntrega.length === 0) {
        toast({
          title: "Erro na validação",
          description: "Não foi possível calcular os itens necessários para a entrega",
          variant: "destructive"
        });
        return false;
      }

      // 2) Validação de estoque (feedback imediato e detalhado)
      const produtosInsuficientes = await validarEstoqueDisponivel(itensEntrega);
      if (produtosInsuficientes.length > 0) {
        const detalhes = produtosInsuficientes
          .map(item => `• ${item.nome}: necessário ${item.necessario}, disponível ${item.disponivel} (falta ${item.faltante})`)
          .join('\n');

        toast({
          title: "Estoque insuficiente",
          description: `Os seguintes produtos não possuem estoque suficiente:\n${detalhes}`,
          variant: "destructive"
        });
        return false;
      }

      // 3) Execução atômica no banco (baixa, histórico e reagendamento)
      const { error: procError } = await supabase.rpc('process_entrega_safe', {
        p_agendamento_id: pedido.id,
        p_observacao: observacao || null
      });

      if (procError) {
        console.error('Erro no processamento da entrega (RPC):', procError);
        toast({
          title: "Erro ao confirmar entrega",
          description: procError.message || "Ocorreu um erro inesperado",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Entrega confirmada",
        description: `Entrega para ${pedido.cliente_nome} confirmada com baixa automática no estoque.`,
      });

      return true;
    } catch (error) {
      console.error('❌ Erro ao confirmar entrega:', error);
      toast({
        title: "Erro ao confirmar entrega",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmarEntregaEmMassa = async (pedidos: PedidoEntrega[]): Promise<boolean> => {
    setLoading(true);
    try {
      console.log('🚚 Iniciando confirmação de entregas em massa (server-side):', pedidos.length);

      // 1) Pré-validação: tentar calcular itens para todos os pedidos
      const pedidosComItens: Array<{ pedido: PedidoEntrega; itens: any[] }> = [];
      const pedidosComErro: string[] = [];

      for (const pedido of pedidos) {
        try {
          const itensEntrega = await calcularItensEntrega(pedido);
          pedidosComItens.push({ pedido, itens: itensEntrega });
        } catch (error) {
          console.error(`Erro ao calcular itens para ${pedido.cliente_nome}:`, error);
          pedidosComErro.push(`${pedido.cliente_nome}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
      }

      // Se há pedidos com erro, abortar operação
      if (pedidosComErro.length > 0) {
        toast({
          title: "Erro na pré-validação",
          description: `Não foi possível calcular itens para alguns pedidos:\n${pedidosComErro.join('\n')}`,
          variant: "destructive"
        });
        return false;
      }

      // 2) Agregar necessidades por produto
      const todosProdutosNecessarios: Record<string, { quantidade: number; nome: string }> = {};

      for (const { itens } of pedidosComItens) {
        for (const item of itens) {
          if (!item.produto_id || Number(item.quantidade) <= 0) continue;
          
          if (!todosProdutosNecessarios[item.produto_id]) {
            todosProdutosNecessarios[item.produto_id] = { 
              quantidade: 0, 
              nome: item.produto_nome 
            };
          }
          todosProdutosNecessarios[item.produto_id].quantidade += Number(item.quantidade);
        }
      }

      // 3) Validar saldos consolidados
      const produtosInsuficientes: ProdutoInsuficiente[] = [];
      
      for (const [produtoId, { quantidade: quantidadeTotal, nome }] of Object.entries(todosProdutosNecessarios)) {
        const saldoAtual = await obterSaldoProduto(produtoId);
        
        if (saldoAtual < quantidadeTotal) {
          produtosInsuficientes.push({
            nome,
            necessario: quantidadeTotal,
            disponivel: saldoAtual,
            faltante: quantidadeTotal - saldoAtual
          });
        }
      }

      if (produtosInsuficientes.length > 0) {
        const detalhes = produtosInsuficientes
          .map(item => `• ${item.nome}: necessário ${item.necessario}, disponível ${item.disponivel} (falta ${item.faltante})`)
          .join('\n');

        toast({
          title: "Estoque insuficiente para entrega em massa",
          description: `Os seguintes produtos não possuem estoque suficiente:\n${detalhes}`,
          variant: "destructive"
        });
        return false;
      }

      // 4) Processar cada entrega no servidor (transação por pedido)
      let sucesso = 0;
      const erros: string[] = [];
      
      for (const { pedido } of pedidosComItens) {
        try {
          const { error: procError } = await supabase.rpc('process_entrega_safe', {
            p_agendamento_id: pedido.id,
            p_observacao: null
          });

          if (procError) {
            console.error(`Erro ao processar entrega do cliente ${pedido.cliente_nome}:`, procError);
            erros.push(`${pedido.cliente_nome}: ${procError.message}`);
            continue;
          }
          sucesso += 1;
        } catch (error) {
          console.error(`Erro fatal ao processar entrega do cliente ${pedido.cliente_nome}:`, error);
          erros.push(`${pedido.cliente_nome}: ${error instanceof Error ? error.message : 'Erro inesperado'}`);
        }
      }

      if (sucesso === 0) {
        toast({
          title: "Falha ao confirmar entregas",
          description: erros.length > 0 ? erros.join('\n') : "Nenhuma entrega foi processada com sucesso.",
          variant: "destructive"
        });
        return false;
      }

      if (erros.length > 0) {
        toast({
          title: "Entregas parcialmente confirmadas",
          description: `${sucesso} de ${pedidos.length} entregas confirmadas. Erros: ${erros.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Entregas confirmadas",
          description: `${sucesso} de ${pedidos.length} entregas confirmadas com baixa automática no estoque.`,
        });
      }

      return true;
    } catch (error) {
      console.error('❌ Erro na confirmação em massa:', error);
      toast({
        title: "Erro na confirmação em massa",
        description: error instanceof Error ? error.message : "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmarEntrega,
    confirmarEntregaEmMassa,
    loading
  };
};
