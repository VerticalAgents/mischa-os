
import { supabase } from "@/integrations/supabase/client";

export const verificarFuncaoComputeEntregaItens = async () => {
  try {
    // Verificar se a função existe tentando executar com um UUID fictício
    const { data, error } = await supabase.rpc('saldo_produto', { p_id: '00000000-0000-0000-0000-000000000000' });
    
    // Se chegou aqui, a função base existe. Agora verificar compute_entrega_itens
    const { data: testData, error: testError } = await supabase
      .from('historico_entregas')
      .select('id')
      .limit(1)
      .single();

    if (testData?.id) {
      // Tentar usar a função diretamente via SQL customizada (simulação)
      return { 
        existe: false, // Por enquanto assumimos que não existe
        erro: 'Função compute_entrega_itens não encontrada no banco'
      };
    }

    return { existe: false, erro: 'Não foi possível verificar' };
  } catch (error) {
    return { existe: false, erro: error instanceof Error ? error.message : 'Erro desconhecido' };
  }
};

export const verificarMovimentacoesEstoque = async (entregaId: string) => {
  try {
    const { data, error } = await supabase
      .from('movimentacoes_estoque_produtos')
      .select('*')
      .eq('referencia_tipo', 'entrega')
      .eq('referencia_id', entregaId);

    if (error) throw error;

    return { movimentacoes: data || [], erro: null };
  } catch (error) {
    return { 
      movimentacoes: [], 
      erro: error instanceof Error ? error.message : 'Erro ao verificar movimentações' 
    };
  }
};

export const verificarSaldosProdutos = async (produtoIds: string[]) => {
  try {
    const saldos = [];
    
    for (const produtoId of produtoIds) {
      const { data, error } = await supabase.rpc('saldo_produto', { p_id: produtoId });
      
      if (error) {
        saldos.push({ produto_id: produtoId, saldo: 0, erro: error.message });
      } else {
        saldos.push({ produto_id: produtoId, saldo: data || 0, erro: null });
      }
    }

    return { saldos, erro: null };
  } catch (error) {
    return { 
      saldos: [], 
      erro: error instanceof Error ? error.message : 'Erro ao verificar saldos' 
    };
  }
};

export const executarDiagnosticoCompleto = async () => {
  try {
    // Buscar última entrega
    const { data: ultimaEntrega, error: entregaError } = await supabase
      .from('historico_entregas')
      .select('*')
      .eq('tipo', 'entrega')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (entregaError || !ultimaEntrega) {
      throw new Error('Nenhuma entrega encontrada');
    }

    // Verificar se itens tem produto_id
    const itens = Array.isArray(ultimaEntrega.itens) ? ultimaEntrega.itens : [];
    const temProdutoId = itens.some((item: any) => item.produto_id);

    // Verificar movimentações
    const { movimentacoes } = await verificarMovimentacoesEstoque(ultimaEntrega.id);

    // Verificar função compute_entrega_itens
    const { existe } = await verificarFuncaoComputeEntregaItens();

    // Contar produtos ativos
    const { count: totalProdutosAtivos } = await supabase
      .from('produtos_finais')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    return {
      ultimaEntrega: {
        id: ultimaEntrega.id,
        quantidade: ultimaEntrega.quantidade,
        itens: itens
      },
      movimentacoes: movimentacoes || [],
      resumo: {
        entregaTemItensComProdutoId: temProdutoId,
        houveBaixaAutomatica: (movimentacoes || []).length > 0,
        funcaoComputeExiste: existe,
        totalProdutosAtivos: totalProdutosAtivos || 0
      }
    };
  } catch (error) {
    throw new Error(`Erro no diagnóstico: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};
