
// Utility functions for stock deduction diagnosis and testing
import { supabase } from "@/integrations/supabase/client";

export interface EntregaDiagnostic {
  id: string;
  quantidade: number;
  itens: any[];
  computeResult: any[];
}

export const diagnosticarUltimaEntrega = async (): Promise<EntregaDiagnostic | null> => {
  try {
    console.log('🔍 Buscando última entrega registrada...');
    
    // Buscar a última entrega do tipo 'entrega'
    const { data: ultimaEntrega, error: entregaError } = await supabase
      .from('historico_entregas')
      .select('id, quantidade, itens')
      .eq('tipo', 'entrega')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (entregaError || !ultimaEntrega) {
      console.error('❌ Erro ao buscar última entrega:', entregaError);
      return null;
    }

    console.log('📦 Última entrega encontrada:', {
      id: ultimaEntrega.id,
      quantidade: ultimaEntrega.quantidade,
      itens: ultimaEntrega.itens
    });

    // Tentar executar compute_entrega_itens se existir
    let computeResult: any[] = [];
    try {
      const { data: computeData, error: computeError } = await supabase
        .rpc('compute_entrega_itens', { p_entrega_id: ultimaEntrega.id });

      if (computeError) {
        console.warn('⚠️ Função compute_entrega_itens não existe ou falhou:', computeError);
      } else {
        computeResult = computeData || [];
        console.log('🧮 Resultado de compute_entrega_itens:', computeResult);
      }
    } catch (error) {
      console.warn('⚠️ compute_entrega_itens não disponível:', error);
    }

    return {
      id: ultimaEntrega.id,
      quantidade: ultimaEntrega.quantidade,
      itens: ultimaEntrega.itens || [],
      computeResult
    };

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    return null;
  }
};

export const verificarMovimentacoesEstoque = async (entregaId: string) => {
  try {
    console.log('🔍 Verificando movimentações de estoque para entrega:', entregaId);
    
    const { data: movimentacoes, error } = await supabase
      .from('movimentacoes_estoque_produtos')
      .select('*')
      .eq('referencia_tipo', 'entrega')
      .eq('referencia_id', entregaId);

    if (error) {
      console.error('❌ Erro ao buscar movimentações:', error);
      return [];
    }

    console.log('📊 Movimentações encontradas:', movimentacoes);
    return movimentacoes || [];

  } catch (error) {
    console.error('❌ Erro na verificação de movimentações:', error);
    return [];
  }
};

export const verificarSaldosProdutos = async () => {
  try {
    console.log('🔍 Verificando saldos atuais dos produtos...');
    
    const { data: produtos, error } = await supabase
      .from('produtos_finais')
      .select('id, nome, estoque_atual')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error('❌ Erro ao buscar saldos:', error);
      return [];
    }

    console.log('📊 Saldos atuais:', produtos);
    return produtos || [];

  } catch (error) {
    console.error('❌ Erro na verificação de saldos:', error);
    return [];
  }
};

// Função para executar diagnóstico completo
export const executarDiagnosticoCompleto = async () => {
  console.log('🚀 Iniciando diagnóstico completo...');
  
  const ultimaEntrega = await diagnosticarUltimaEntrega();
  if (!ultimaEntrega) {
    console.log('❌ Não foi possível encontrar a última entrega');
    return null;
  }

  const movimentacoes = await verificarMovimentacoesEstoque(ultimaEntrega.id);
  const saldos = await verificarSaldosProdutos();

  const diagnostico = {
    ultimaEntrega,
    movimentacoes,
    saldos,
    resumo: {
      entregaTemItensComProdutoId: ultimaEntrega.itens.some(item => item.produto_id),
      houveBaixaAutomatica: movimentacoes.length > 0,
      totalProdutosAtivos: saldos.length
    }
  };

  console.log('📋 Diagnóstico completo:', diagnostico);
  return diagnostico;
};
