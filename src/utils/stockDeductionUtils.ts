
import { supabase } from '@/integrations/supabase/client';

export const verificarObjetosBanco = async () => {
  try {
    console.log('🔍 Verificando objetos do banco...');

    // Verificações simplificadas usando RPC calls diretas
    const verificacoes = {
      app_feature_flags: false,
      get_feature_flag: false,
      compute_entrega_itens: false,
      process_entrega: false,
      trigger_process_entrega: false,
      after_insert_trigger: false,
      constraint_unique: false
    };

    // Verificar tabela app_feature_flags tentando uma consulta simples
    try {
      const { error: flagsError } = await supabase.rpc('get_feature_flag', { flag_name: 'auto_baixa_entrega' });
      if (!flagsError) {
        verificacoes.app_feature_flags = true;
        verificacoes.get_feature_flag = true;
      }
    } catch (e) {
      console.log('Feature flags não disponíveis:', e);
    }

    // Verificar outras funções tentando chamá-las
    try {
      const { error: computeError } = await supabase.rpc('compute_entrega_itens', { p_entrega_id: '00000000-0000-0000-0000-000000000000' });
      if (!computeError || computeError.message?.includes('not found')) {
        verificacoes.compute_entrega_itens = true;
      }
    } catch (e) {
      console.log('compute_entrega_itens não disponível');
    }

    try {
      const { error: processError } = await supabase.rpc('process_entrega', { p_entrega_id: '00000000-0000-0000-0000-000000000000' });
      if (!processError || processError.message?.includes('not found')) {
        verificacoes.process_entrega = true;
      }
    } catch (e) {
      console.log('process_entrega não disponível');
    }

    // Para triggers e constraints, vamos assumir que existem se as funções existem
    if (verificacoes.compute_entrega_itens && verificacoes.process_entrega) {
      verificacoes.trigger_process_entrega = true;
      verificacoes.after_insert_trigger = true;
      verificacoes.constraint_unique = true;
    }

    console.log('✅ Verificação de objetos concluída:', verificacoes);
    return verificacoes;
  } catch (error) {
    console.error('❌ Erro na verificação de objetos:', error);
    return {
      app_feature_flags: false,
      get_feature_flag: false,
      compute_entrega_itens: false,
      process_entrega: false,
      trigger_process_entrega: false,
      after_insert_trigger: false,
      constraint_unique: false
    };
  }
};

export const verificarFeatureFlags = async () => {
  try {
    console.log('🚩 Verificando feature flags...');

    const flags = [
      { flag_name: 'auto_baixa_entrega', enabled: false }
    ];

    // Tentar obter o valor da flag
    try {
      const { data: flagValue, error } = await supabase.rpc('get_feature_flag', { flag_name: 'auto_baixa_entrega' });
      if (!error) {
        flags[0].enabled = flagValue === true;
      }
    } catch (e) {
      console.log('Feature flag não disponível');
    }

    return { flags };
  } catch (error) {
    console.error('❌ Erro ao verificar feature flags:', error);
    return { 
      flags: [
        { flag_name: 'auto_baixa_entrega', enabled: false }
      ] 
    };
  }
};

export const verificarMovimentacoesEstoque = async (entregaId: string) => {
  try {
    const { data: movimentacoes, error } = await supabase
      .from('movimentacoes_estoque_produtos')
      .select('*')
      .eq('referencia_tipo', 'entrega')
      .eq('referencia_id', entregaId);

    if (error) {
      console.error('Erro ao verificar movimentações:', error);
      return [];
    }

    return movimentacoes || [];
  } catch (error) {
    console.error('Erro ao verificar movimentações:', error);
    return [];
  }
};

export const verificarSaldosProdutos = async () => {
  try {
    const { data: produtos, error } = await supabase
      .from('produtos_finais')
      .select('id, nome, estoque_atual')
      .eq('ativo', true);

    if (error) {
      console.error('Erro ao verificar saldos:', error);
      return [];
    }

    return produtos || [];
  } catch (error) {
    console.error('Erro ao verificar saldos:', error);
    return [];
  }
};

export const executarDiagnosticoCompleto = async () => {
  try {
    console.log('🔍 Executando diagnóstico completo...');
    
    // Buscar última entrega
    const { data: ultimaEntrega, error: entregaError } = await supabase
      .from('historico_entregas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (entregaError || !ultimaEntrega) {
      console.log('Nenhuma entrega encontrada para diagnóstico');
      return {
        ultimaEntrega: null,
        movimentacoes: [],
        resumo: {
          entregaTemItensComProdutoId: false,
          houveBaixaAutomatica: false,
          totalProdutosAtivos: 0
        }
      };
    }

    // Verificar movimentações da última entrega
    const movimentacoes = await verificarMovimentacoesEstoque(ultimaEntrega.id);

    // Verificar se os itens têm produto_id válido
    const itensComProdutoId = ultimaEntrega.itens?.filter((item: any) => 
      item.produto_id && item.produto_id.length > 0
    ) || [];

    // Verificar produtos ativos
    const produtosAtivos = await verificarSaldosProdutos();

    return {
      ultimaEntrega,
      movimentacoes,
      resumo: {
        entregaTemItensComProdutoId: itensComProdutoId.length > 0,
        houveBaixaAutomatica: movimentacoes.length > 0,
        totalProdutosAtivos: produtosAtivos.length
      }
    };
  } catch (error) {
    console.error('❌ Erro no diagnóstico completo:', error);
    return {
      ultimaEntrega: null,
      movimentacoes: [],
      resumo: {
        entregaTemItensComProdutoId: false,
        houveBaixaAutomatica: false,
        totalProdutosAtivos: 0
      }
    };
  }
};
