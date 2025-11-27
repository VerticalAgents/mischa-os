
export interface GiroHistorico {
  semana: string; // Formato: "YYYY-WW" (ano-número da semana)
  valor: number;
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
