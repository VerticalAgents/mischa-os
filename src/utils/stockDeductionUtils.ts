
// Simplified diagnostic utilities for stock deduction debugging
import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticoResultado {
  tipo: string;
  status: 'sucesso' | 'erro' | 'alerta';
  mensagem: string;
  detalhes?: any;
}

// Verificar movimentações de entrega específicas
export const verificarMovimentacoesEntrega = async (entregaId?: string): Promise<DiagnosticoResultado[]> => {
  const resultados: DiagnosticoResultado[] = [];
  
  try {
    let query = supabase
      .from('movimentacoes_estoque_produtos')
      .select('*')
      .eq('referencia_tipo', 'entrega');
    
    if (entregaId) {
      query = query.eq('referencia_id', entregaId);
    }
    
    const { data, error } = await query.order('data_movimentacao', { ascending: false }).limit(20);
    
    if (error) {
      resultados.push({
        tipo: 'movimentacoes_entrega',
        status: 'erro',
        mensagem: `Erro ao consultar movimentações: ${error.message}`,
        detalhes: error
      });
    } else {
      resultados.push({
        tipo: 'movimentacoes_entrega',
        status: 'sucesso',
        mensagem: `${data.length} movimentações encontradas`,
        detalhes: data
      });
    }
  } catch (error) {
    resultados.push({
      tipo: 'movimentacoes_entrega',
      status: 'erro',
      mensagem: `Erro inesperado: ${error}`,
      detalhes: error
    });
  }
  
  return resultados;
};

// Verificar histórico de entregas
export const verificarHistoricoEntregas = async (limite: number = 10): Promise<DiagnosticoResultado[]> => {
  const resultados: DiagnosticoResultado[] = [];
  
  try {
    const { data, error } = await supabase
      .from('historico_entregas')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limite);
    
    if (error) {
      resultados.push({
        tipo: 'historico_entregas',
        status: 'erro',
        mensagem: `Erro ao consultar histórico: ${error.message}`,
        detalhes: error
      });
    } else {
      resultados.push({
        tipo: 'historico_entregas',
        status: 'sucesso',
        mensagem: `${data.length} registros no histórico`,
        detalhes: data
      });
    }
  } catch (error) {
    resultados.push({
      tipo: 'historico_entregas',
      status: 'erro',
      mensagem: `Erro inesperado: ${error}`,
      detalhes: error
    });
  }
  
  return resultados;
};

// Executar diagnóstico básico
export const executarDiagnosticoBasico = async (): Promise<DiagnosticoResultado[]> => {
  const resultados: DiagnosticoResultado[] = [];
  
  // Verificar movimentações recentes
  const movimentacoes = await verificarMovimentacoesEntrega();
  resultados.push(...movimentacoes);
  
  // Verificar histórico recente
  const historico = await verificarHistoricoEntregas();
  resultados.push(...historico);
  
  return resultados;
};
