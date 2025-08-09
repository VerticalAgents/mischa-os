
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useProdutoStore } from '@/hooks/useProdutoStore';

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
  const { produtos } = useProdutoStore();

  const calcularItensEntrega = (pedido: PedidoEntrega) => {
    console.log('🧮 Calculando itens para entrega:', pedido);

    if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
      // Usar itens personalizados
      return pedido.itens_personalizados.map((item: any) => ({
        produto_id: produtos.find(p => p.nome === item.produto)?.id || null,
        produto_nome: item.produto || item.nome,
        quantidade: Number(item.quantidade || 0)
      })).filter((item: any) => item.produto_id); // Filtrar apenas produtos válidos
    } else {
      // Usar distribuição padrão baseada nos produtos cadastrados
      const quantidadePorProduto = Math.floor(Number(pedido.quantidade_total) / Math.max(1, produtos.length));
      const resto = Number(pedido.quantidade_total) % Math.max(1, produtos.length);
      
      return produtos.slice(0, Math.min(produtos.length, 5)).map((produto, index) => ({
        produto_id: produto.id,
        produto_nome: produto.nome,
        quantidade: quantidadePorProduto + (index < resto ? 1 : 0)
      })).filter(item => item.quantidade > 0);
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

      return data || 0;
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
      console.log('🚚 Iniciando confirmação de entrega com validação de estoque:', pedido.id);

      // 1. Calcular itens necessários para a entrega
      const itensEntrega = calcularItensEntrega(pedido);
      console.log('📦 Itens calculados para entrega:', itensEntrega);

      if (itensEntrega.length === 0) {
        toast({
          title: "Erro na validação",
          description: "Não foi possível calcular os itens necessários para a entrega",
          variant: "destructive"
        });
        return false;
      }

      // 2. Verificar se já existe movimentação para evitar duplicação
      const { data: movimentacoesExistentes } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('id')
        .eq('referencia_tipo', 'entrega')
        .eq('referencia_id', pedido.id)
        .limit(1);

      if (movimentacoesExistentes && movimentacoesExistentes.length > 0) {
        toast({
          title: "Entrega já processada",
          description: "Esta entrega já foi confirmada anteriormente",
          variant: "destructive"
        });
        return false;
      }

      // 3. Validar estoque disponível
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

      // 4. Executar baixa no estoque (criar movimentações de saída)
      console.log('✅ Estoque suficiente. Executando baixas...');
      
      for (const item of itensEntrega) {
        if (!item.produto_id || Number(item.quantidade) <= 0) continue;

        const { error: movimentacaoError } = await supabase
          .from('movimentacoes_estoque_produtos')
          .insert({
            produto_id: item.produto_id,
            tipo: 'saida',
            quantidade: Number(item.quantidade),
            data_movimentacao: new Date().toISOString(),
            referencia_tipo: 'entrega',
            referencia_id: pedido.id,
            observacao: `Entrega confirmada - ${pedido.cliente_nome}${observacao ? ` | ${observacao}` : ''}`
          });

        if (movimentacaoError) {
          console.error('Erro ao criar movimentação:', movimentacaoError);
          throw new Error(`Erro ao processar baixa do produto ${item.produto_nome}: ${movimentacaoError.message}`);
        }
      }

      // 5. Registrar no histórico de entregas
      const { error: historicoError } = await supabase
        .from('historico_entregas')
        .insert({
          cliente_id: pedido.cliente_id,
          data: new Date().toISOString(),
          quantidade: Number(pedido.quantidade_total),
          tipo: 'entrega',
          observacao: `Entrega confirmada via expedição${observacao ? ` | ${observacao}` : ''}`,
          itens: itensEntrega.map(item => ({
            produto_id: item.produto_id,
            produto_nome: item.produto_nome,
            quantidade: Number(item.quantidade)
          }))
        });

      if (historicoError) {
        console.error('Erro ao registrar histórico:', historicoError);
        throw new Error(`Erro ao registrar histórico de entrega: ${historicoError.message}`);
      }

      // 6. Reagendar para próxima entrega
      const proximaData = new Date();
      proximaData.setDate(proximaData.getDate() + 7); // Reagendar para 7 dias

      const { error: reagendamentoError } = await supabase
        .from('agendamentos_clientes')
        .update({
          data_proxima_reposicao: proximaData.toISOString().split('T')[0],
          substatus_pedido: 'Agendado',
          updated_at: new Date().toISOString()
        })
        .eq('id', pedido.id);

      if (reagendamentoError) {
        console.error('Erro ao reagendar:', reagendamentoError);
        // Não falhar por erro de reagendamento, apenas avisar
        toast({
          title: "Entrega confirmada com aviso",
          description: "Entrega confirmada mas houve erro no reagendamento automático",
          variant: "destructive"
        });
      }

      console.log('✅ Baixas no estoque executadas com sucesso');

      toast({
        title: "Entrega confirmada",
        description: `Entrega para ${pedido.cliente_nome} confirmada com baixa automática no estoque`,
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
      console.log('🚚 Iniciando confirmação de entregas em massa:', pedidos.length);

      // Validar estoque para todos os pedidos primeiro
      const todosProdutosNecessarios: { [key: string]: number } = {};

      for (const pedido of pedidos) {
        const itensEntrega = calcularItensEntrega(pedido);
        
        for (const item of itensEntrega) {
          if (!item.produto_id || Number(item.quantidade) <= 0) continue;
          
          if (!todosProdutosNecessarios[item.produto_id]) {
            todosProdutosNecessarios[item.produto_id] = 0;
          }
          todosProdutosNecessarios[item.produto_id] += Number(item.quantidade);
        }
      }

      // Verificar saldos consolidados
      const produtosInsuficientes: ProdutoInsuficiente[] = [];
      
      for (const [produtoId, quantidadeTotal] of Object.entries(todosProdutosNecessarios)) {
        const saldoAtual = await obterSaldoProduto(produtoId);
        const produto = produtos.find(p => p.id === produtoId);
        
        if (saldoAtual < quantidadeTotal) {
          produtosInsuficientes.push({
            nome: produto?.nome || 'Produto não encontrado',
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

      // Processar todas as entregas
      for (const pedido of pedidos) {
        const itensEntrega = calcularItensEntrega(pedido);

        // Baixa no estoque
        for (const item of itensEntrega) {
          if (!item.produto_id || Number(item.quantidade) <= 0) continue;

          const { error: movimentacaoError } = await supabase
            .from('movimentacoes_estoque_produtos')
            .insert({
              produto_id: item.produto_id,
              tipo: 'saida',
              quantidade: Number(item.quantidade),
              data_movimentacao: new Date().toISOString(),
              referencia_tipo: 'entrega',
              referencia_id: pedido.id,
              observacao: `Entrega em massa - ${pedido.cliente_nome}`
            });

          if (movimentacaoError) {
            throw new Error(`Erro ao processar entrega de ${pedido.cliente_nome}: ${movimentacaoError.message}`);
          }
        }

        // Registrar no histórico
        const { error: historicoError } = await supabase
          .from('historico_entregas')
          .insert({
            cliente_id: pedido.cliente_id,
            data: new Date().toISOString(),
            quantidade: Number(pedido.quantidade_total),
            tipo: 'entrega',
            observacao: 'Entrega confirmada via expedição em massa',
            itens: itensEntrega.map(item => ({
              produto_id: item.produto_id,
              produto_nome: item.produto_nome,
              quantidade: Number(item.quantidade)
            }))
          });

        if (historicoError) {
          console.error('Erro ao registrar histórico para pedido:', pedido.id, historicoError);
        }

        // Reagendar
        const proximaData = new Date();
        proximaData.setDate(proximaData.getDate() + 7);

        const { error: reagendamentoError } = await supabase
          .from('agendamentos_clientes')
          .update({
            data_proxima_reposicao: proximaData.toISOString().split('T')[0],
            substatus_pedido: 'Agendado',
            updated_at: new Date().toISOString()
          })
          .eq('id', pedido.id);

        if (reagendamentoError) {
          console.error('Erro ao reagendar pedido:', pedido.id, reagendamentoError);
        }
      }

      toast({
        title: "Entregas confirmadas em massa",
        description: `${pedidos.length} entregas confirmadas com baixa automática no estoque`,
      });

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
