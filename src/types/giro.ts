
export interface AnaliseGiroData {
  mediaHistorica: number;
  ultimaSemana: number;
  variacaoPercentual: number;
  meta: number;
  achievement: number;
  historico: { semana: string; valor: number }[];
  semaforo: 'vermelho' | 'amarelo' | 'verde';
}
