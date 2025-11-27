
import { supabase } from '@/integrations/supabase/client';

/**
 * Calcula o giro semanal histórico de um cliente baseado na regra:
 * - Considera as últimas 12 semanas (84 dias)
 * - Para clientes novos com menos de 12 semanas de histórico, usa o período real disponível
 * 
 * @param clienteId - ID do cliente
 * @returns Objeto com giro semanal e número de semanas consideradas
 */
export async function calcularGiroSemanalHistorico(clienteId: string): Promise<{
  giroSemanal: number;
  numeroSemanas: number;
}> {
  try {
    // Calcular data de 84 dias atrás (12 semanas)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 84);

    // Buscar entregas dos últimos 84 dias baseado na coluna 'data'
    const { data: entregas, error } = await supabase
      .from('historico_entregas')
      .select('quantidade, data')
      .eq('cliente_id', clienteId)
      .eq('tipo', 'entrega')
      .gte('data', dataLimite.toISOString())
      .order('data', { ascending: true });

    if (error) {
      console.error('Erro ao buscar entregas para cliente', clienteId, error);
      return { giroSemanal: 0, numeroSemanas: 0 };
    }

    if (!entregas || entregas.length === 0) {
      return { giroSemanal: 0, numeroSemanas: 0 };
    }

    // Somar todas as entregas do período
    const totalEntregas = entregas.reduce((total, entrega) => total + entrega.quantidade, 0);
    
    // Calcular número de semanas reais desde a primeira entrega
    const primeiraEntrega = new Date(entregas[0].data);
    const hoje = new Date();
    const diferencaDias = Math.ceil((hoje.getTime() - primeiraEntrega.getTime()) / (1000 * 60 * 60 * 24));
    const semanasDesdeprimeiraEntrega = Math.ceil(diferencaDias / 7);
    
    // Número de semanas: mínimo 1, máximo 12
    const numeroSemanas = Math.max(1, Math.min(12, semanasDesdeprimeiraEntrega));
    
    // Calcular média semanal baseada no período real
    const giroSemanal = Math.round(totalEntregas / numeroSemanas);
    
    console.log(`[calcularGiroSemanalHistorico] Cliente ${clienteId}: ${entregas.length} entregas, total: ${totalEntregas}, ${numeroSemanas} semanas, giro semanal: ${giroSemanal}`);
    
    return { giroSemanal, numeroSemanas };
  } catch (error) {
    console.error('Erro no cálculo do giro semanal histórico:', error);
    return { giroSemanal: 0, numeroSemanas: 0 };
  }
}

/**
 * Calcula o giro semanal baseado na quantidade padrão e periodicidade
 * 
 * @param quantidadePadrao - Quantidade padrão do cliente
 * @param periodicidadePadrao - Periodicidade em dias
 * @returns Giro semanal calculado
 */
export function calcularGiroSemanalPadrao(quantidadePadrao: number, periodicidadePadrao: number): number {
  if (periodicidadePadrao === 0 || quantidadePadrao === 0) return 0;
  return Math.round((quantidadePadrao / periodicidadePadrao) * 7);
}

/**
 * Calcula a meta de giro semanal (10% acima do giro padrão)
 * 
 * @param quantidadePadrao - Quantidade padrão do cliente
 * @param periodicidadePadrao - Periodicidade em dias
 * @returns Meta de giro semanal
 */
export function calcularMetaGiroSemanal(quantidadePadrao: number, periodicidadePadrao: number): number {
  const giroBase = calcularGiroSemanalPadrao(quantidadePadrao, periodicidadePadrao);
  return Math.round(giroBase * 1.1); // 10% acima do giro base
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
 * Função auxiliar para obter datas de início e fim de uma semana ISO
 */
export function getWeekDateRange(year: number, week: number): { startDate: Date; endDate: Date } {
  // Encontrar a primeira segunda-feira do ano
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay();
  
  // Calcular o primeiro dia da semana 1 (pode ser no ano anterior)
  const daysToFirstMonday = dayOfWeek <= 4 ? 1 - dayOfWeek : 8 - dayOfWeek;
  const week1Monday = new Date(year, 0, 1 + daysToFirstMonday);
  
  // Calcular a segunda-feira da semana desejada
  const startDate = new Date(week1Monday);
  startDate.setDate(week1Monday.getDate() + (week - 1) * 7);
  
  // Domingo da mesma semana
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  return { startDate, endDate };
}

/**
 * Função para gerar array de 12 semanas (mantida para compatibilidade com gráficos)
 */
export function gerarUltimas12Semanas(): Array<{ 
  ano: number; 
  semana: number; 
  chave: string; 
  display: string;
  startDate: Date;
  endDate: Date;
}> {
  const semanas: Array<{ 
    ano: number; 
    semana: number; 
    chave: string; 
    display: string;
    startDate: Date;
    endDate: Date;
  }> = [];
  const hoje = new Date();
  
  for (let i = 11; i >= 0; i--) {
    const data = new Date();
    data.setDate(hoje.getDate() - (i * 7));
    const { year, week } = getISOWeekNumber(data);
    const chave = `${year}-${week.toString().padStart(2, '0')}`;
    const display = formatarSemanaDisplay(year, week);
    const { startDate, endDate } = getWeekDateRange(year, week);
    
    semanas.push({
      ano: year,
      semana: week,
      chave,
      display,
      startDate,
      endDate
    });
  }
  
  return semanas;
}

/**
 * Calcula giro semanal médio baseado em histórico consolidado (últimas 12 semanas ou menos)
 * @param clienteId - ID do cliente
 * @returns Giro semanal médio real e número de semanas consideradas
 */
export async function calcularGiroSemanalHistoricoConsolidado(
  clienteId: string
): Promise<{ giroSemanal: number; numeroSemanas: number }> {
  try {
    const { data, error } = await supabase
      .from('historico_giro_semanal_consolidado')
      .select('giro_semanal, semana')
      .eq('cliente_id', clienteId)
      .order('semana', { ascending: false })
      .limit(12);

    if (error) throw error;
    if (!data || data.length === 0) {
      return { giroSemanal: 0, numeroSemanas: 0 };
    }

    const totalGiro = data.reduce((sum, reg) => sum + (reg.giro_semanal || 0), 0);
    const mediaGiro = Math.round(totalGiro / data.length);

    console.log(`[GiroHistórico] Cliente ${clienteId.substring(0, 8)}: ${data.length} semanas, média ${mediaGiro}`);
    
    return {
      giroSemanal: mediaGiro,
      numeroSemanas: data.length
    };
  } catch (error) {
    console.error('Erro ao calcular giro histórico consolidado:', error);
    return { giroSemanal: 0, numeroSemanas: 0 };
  }
}
