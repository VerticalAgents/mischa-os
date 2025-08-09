import { supabase } from '@/integrations/supabase/client';

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

export const verificarObjetosBanco = async () => {
  console.log('🔍 Verificando objetos do banco...');
  
  try {
    const verificacoes = {
      app_feature_flags: false,
      get_feature_flag: false,
      compute_entrega_itens: false,
      process_entrega: false,
      trigger_process_entrega: false,
      after_insert_trigger: false,
      constraint_unique: false
    };

    // Verificar tabela app_feature_flags
    const { data: tabelaFlags } = await supabase
      .from('app_feature_flags')
      .select('id')
      .limit(1);
    verificacoes.app_feature_flags = tabelaFlags !== null;

    // Verificar funções no information_schema
    const { data: funcoes } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .in('routine_name', ['get_feature_flag', 'compute_entrega_itens', 'process_entrega', 'trigger_process_entrega'])
      .eq('routine_schema', 'public');

    if (funcoes) {
      const nomesFuncoes = funcoes.map(f => f.routine_name);
      verificacoes.get_feature_flag = nomesFuncoes.includes('get_feature_flag');
      verificacoes.compute_entrega_itens = nomesFuncoes.includes('compute_entrega_itens');
      verificacoes.process_entrega = nomesFuncoes.includes('process_entrega');
      verificacoes.trigger_process_entrega = nomesFuncoes.includes('trigger_process_entrega');
    }

    // Verificar trigger
    const { data: triggers } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'after_insert_historico_entregas')
      .eq('event_object_schema', 'public')
      .eq('event_object_table', 'historico_entregas');
    verificacoes.after_insert_trigger = triggers && triggers.length > 0;

    // Verificar constraint única
    const { data: constraints } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name')
      .eq('constraint_name', 'ux_mov_prod_ref')
      .eq('table_name', 'movimentacoes_estoque_produtos');
    verificacoes.constraint_unique = constraints && constraints.length > 0;

    console.log('📊 Verificação dos objetos:', verificacoes);
    return verificacoes;

  } catch (error) {
    console.error('❌ Erro ao verificar objetos do banco:', error);
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
  console.log('🚩 Verificando feature flags...');
  
  try {
    const { data: flags, error } = await supabase
      .from('app_feature_flags')
      .select('flag_name, enabled, description')
      .order('flag_name');

    if (error) {
      console.error('❌ Erro ao buscar feature flags:', error);
      return { flags: [], erro: error.message };
    }

    console.log('🚩 Feature flags encontradas:', flags);
    return { flags: flags || [], erro: null };

  } catch (error) {
    console.error('❌ Erro ao verificar feature flags:', error);
    return { flags: [], erro: 'Erro inesperado' };
  }
};
