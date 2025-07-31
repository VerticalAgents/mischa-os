
import { supabase } from '@/integrations/supabase/client';

/**
 * Calcula o giro semanal histórico de um cliente baseado na regra padrão:
 * Todas as unidades entregues nos últimos 28 dias dividido por 4
 * 
 * @param clienteId - ID do cliente
 * @returns Número de unidades por semana (média histórica)
 */
export async function calcularGiroSemanalHistorico(clienteId: string): Promise<number> {
  try {
    // Calcular data de 28 dias atrás
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 28);

    // Buscar entregas dos últimos 28 dias baseado na coluna 'data'
    const { data: entregas, error } = await supabase
      .from('historico_entregas')
      .select('quantidade')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'entrega')
      .gte('data', dataLimite.toISOString())
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar entregas para cliente', clienteId, error);
      return 0;
    }

    if (!entregas || entregas.length === 0) {
      return 0;
    }

    // Somar todas as entregas dos últimos 28 dias
    const totalEntregas = entregas.reduce((total, entrega) => total + entrega.quantidade, 0);
    
    // Calcular média semanal (total dividido por 4 semanas)
    const giroSemanal = Math.round(totalEntregas / 4);
    
    console.log(`[calcularGiroSemanalHistorico] Cliente ${clienteId}: ${entregas.length} entregas, total: ${totalEntregas}, giro semanal: ${giroSemanal}`);
    
    return giroSemanal;
  } catch (error) {
    console.error('Erro no cálculo do giro semanal histórico:', error);
    return 0;
  }
}

/**
 * Versão síncrona que usa dados já carregados em memória
 * Útil quando já temos os dados de entregas disponíveis
 * 
 * @param clienteId - ID do cliente
 * @param registrosEntregas - Array com histórico de entregas já carregado
 * @returns Número de unidades por semana (média histórica)
 */
export function calcularGiroSemanalHistoricoSync(clienteId: string, registrosEntregas: any[]): number {
  try {
    // Calcular data de 28 dias atrás
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 28);

    // Filtrar entregas dos últimos 28 dias do cliente
    const entregas = registrosEntregas.filter(registro => 
      registro.cliente_id === clienteId && 
      registro.tipo === 'entrega' &&
      new Date(registro.data) >= dataLimite
    );

    if (entregas.length === 0) {
      return 0;
    }

    // Somar todas as entregas dos últimos 28 dias
    const totalEntregas = entregas.reduce((total, entrega) => total + entrega.quantidade, 0);
    
    // Calcular média semanal (total dividido por 4 semanas)
    const giroSemanal = Math.round(totalEntregas / 4);
    
    console.log(`[calcularGiroSemanalHistoricoSync] Cliente ${clienteId}: ${entregas.length} entregas, total: ${totalEntregas}, giro semanal: ${giroSemanal}`);
    
    return giroSemanal;
  } catch (error) {
    console.error('Erro no cálculo do giro semanal histórico sync:', error);
    return 0;
  }
}

/**
 * Função para obter o número da semana ISO (mantida para compatibilidade com gráficos)
 */
export function getISOWeekNumber(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  return { year: target.getFullYear(), week: weekNumber };
}

/**
 * Função para formatar semana para exibição (mantida para compatibilidade com gráficos)
 */
export function formatarSemanaDisplay(ano: number, semana: number): string {
  return `Sem ${semana.toString().padStart(2, '0')}`;
}

/**
 * Função para gerar array de 12 semanas (mantida para compatibilidade com gráficos)
 */
export function gerarUltimas12Semanas(): Array<{ ano: number; semana: number; chave: string; display: string }> {
  const semanas: Array<{ ano: number; semana: number; chave: string; display: string }> = [];
  const hoje = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - (i * 7));
    const { year, week } = getISOWeekNumber(data);
    const chave = `${year}-${week.toString().padStart(2, '0')}`;
    const display = formatarSemanaDisplay(year, week);
    
    semanas.push({
      ano: year,
      semana: week,
      chave,
      display
    });
  }
  
  return semanas;
}
