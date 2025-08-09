
import { supabase } from '@/integrations/supabase/client';

interface DiagnosticoResultado {
  temFlagAtiva: boolean;
  temFuncaoComputeItens: boolean;
  temTriggerProcessEntrega: boolean;
  temRestricaoUnica: boolean;
  detalhes: {
    flagStatus: string;
    funcaoStatus: string;
    triggerStatus: string;
    restricaoStatus: string;
  };
}

export const diagnosticarConfiguracaoEstoque = async (): Promise<DiagnosticoResultado> => {
  const resultado: DiagnosticoResultado = {
    temFlagAtiva: false,
    temFuncaoComputeItens: false,
    temTriggerProcessEntrega: false,
    temRestricaoUnica: false,
    detalhes: {
      flagStatus: 'Verificando...',
      funcaoStatus: 'Verificando...',
      triggerStatus: 'Verificando...',
      restricaoStatus: 'Verificando...'
    }
  };

  try {
    // 1. Verificar se existe a tabela feature_flags
    console.log('🔍 Verificando tabela feature_flags...');
    const { data: flagsTable, error: flagsError } = await supabase
      .from('feature_flags')
      .select('*')
      .limit(1);

    if (flagsError) {
      console.log('❌ Tabela feature_flags não existe:', flagsError.message);
      resultado.detalhes.flagStatus = 'Tabela feature_flags não existe';
    } else {
      // Verificar flag específica
      const { data: flagData, error: flagQueryError } = await supabase
        .from('feature_flags')
        .select('enabled')
        .eq('name', 'auto_baixa_entrega')
        .single();

      if (flagQueryError) {
        console.log('❌ Flag auto_baixa_entrega não encontrada:', flagQueryError.message);
        resultado.detalhes.flagStatus = 'Flag auto_baixa_entrega não encontrada';
      } else {
        resultado.temFlagAtiva = flagData.enabled;
        resultado.detalhes.flagStatus = flagData.enabled ? 'Ativa' : 'Inativa';
        console.log(`✅ Flag auto_baixa_entrega: ${flagData.enabled ? 'ATIVA' : 'INATIVA'}`);
      }
    }

    // 2. Verificar constraint única em movimentacoes_estoque_produtos
    console.log('🔍 Verificando constraint única...');
    const { data: constraintData, error: constraintError } = await supabase
      .rpc('check_unique_constraint_exists')
      .single();

    if (constraintError) {
      console.log('❌ Erro ao verificar constraint:', constraintError.message);
      resultado.detalhes.restricaoStatus = 'Erro ao verificar constraint';
    } else {
      resultado.temRestricaoUnica = constraintData || false;
      resultado.detalhes.restricaoStatus = constraintData ? 'Presente' : 'Ausente';
      console.log(`${constraintData ? '✅' : '❌'} Constraint única: ${constraintData ? 'PRESENTE' : 'AUSENTE'}`);
    }

    // 3. Verificar se existem dados válidos para testar
    console.log('🔍 Verificando dados de exemplo...');
    const { data: sampleData, error: sampleError } = await supabase
      .from('historico_entregas')
      .select('id')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao verificar dados:', sampleError.message);
    } else {
      console.log(`📊 Registros encontrados no histórico: ${sampleData?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro geral no diagnóstico:', error);
  }

  return resultado;
};

export const verificarEstoqueProduto = async (produtoId: string): Promise<{
  existe: boolean;
  estoque: number;
  nome: string;
}> => {
  try {
    const { data, error } = await supabase
      .from('produtos_finais')
      .select('id, nome, estoque_atual')
      .eq('id', produtoId)
      .eq('ativo', true)
      .single();

    if (error) {
      console.log(`❌ Produto ${produtoId} não encontrado:`, error.message);
      return { existe: false, estoque: 0, nome: 'N/A' };
    }

    return {
      existe: true,
      estoque: data.estoque_atual || 0,
      nome: data.nome
    };
  } catch (error) {
    console.error('❌ Erro ao verificar produto:', error);
    return { existe: false, estoque: 0, nome: 'N/A' };
  }
};

export const verificarMovimentacoesEntrega = async (entregaId: string): Promise<{
  existeMovimentacao: boolean;
  totalMovimentacoes: number;
  detalhes: any[];
}> => {
  try {
    const { data, error } = await supabase
      .from('movimentacoes_estoque_produtos')
      .select('*')
      .eq('referencia_tipo', 'entrega')
      .eq('referencia_id', entregaId);

    if (error) {
      console.error('❌ Erro ao verificar movimentações:', error);
      return { existeMovimentacao: false, totalMovimentacoes: 0, detalhes: [] };
    }

    return {
      existeMovimentacao: (data?.length || 0) > 0,
      totalMovimentacoes: data?.length || 0,
      detalhes: data || []
    };
  } catch (error) {
    console.error('❌ Erro ao verificar movimentações:', error);
    return { existeMovimentacao: false, totalMovimentacoes: 0, detalhes: [] };
  }
};
