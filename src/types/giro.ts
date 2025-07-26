
export interface GiroHistorico {
  semana: string;
  valor: number;
  entregas?: Array<{
    data: string;
    quantidade: number;
    tipo: 'entrega' | 'retorno';
  }>;
  periodo?: string;
  dataInicial?: string;
  dataFinal?: string;
}

export interface MetaGiro {
  idCliente: number;
  valorSemanal: number;
  valorMensal: number;
  dataAtualizacao: Date;
}

export interface AnaliseGiroData {
  mediaHistorica: number;
  ultimaSemana: number;
  variacaoPercentual: number;
  meta: number;
  achievement: number; // porcentagem de atingimento da meta
  historico: GiroHistorico[];
  semaforo: 'vermelho' | 'amarelo' | 'verde';
}
