
export interface GiroHistorico {
  semana: string; // Formato: "Sem XX" (display)
  valor: number;
  startDate?: string; // ISO string da data de início da semana
  endDate?: string; // ISO string da data de fim da semana
}

export interface MetaGiro {
  idCliente: number;
  valorSemanal: number;
  valorMensal: number;
  dataAtualizacao: Date;
}

export interface AnaliseGiroData {
  mediaHistorica: number;
  numeroSemanasHistorico: number; // número de semanas consideradas no cálculo
  ultimaSemana: number;
  variacaoPercentual: number;
  meta: number;
  achievement: number; // porcentagem de atingimento da meta
  historico: GiroHistorico[];
  semaforo: 'vermelho' | 'amarelo' | 'verde';
}
