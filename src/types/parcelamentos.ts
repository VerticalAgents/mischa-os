export interface TipoParcelamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartaoCredito {
  id: string;
  nome: string;
  bandeira: string;
  ultimos_digitos: string;
  dia_vencimento: number;
  dia_fechamento: number;
  limite_credito: number;
  cor_identificacao: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parcelamento {
  id: string;
  tipo_parcelamento_id: string;
  cartao_id: string;
  descricao: string;
  valor_total: number;
  numero_parcelas: number;
  data_compra: string;
  status: 'ativo' | 'quitado' | 'cancelado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
  tipo_parcelamento?: TipoParcelamento;
  cartao?: CartaoCredito;
}

export interface Parcela {
  id: string;
  parcelamento_id: string;
  numero_parcela: number;
  valor_parcela: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado';
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResumoParcelamentos {
  total_parcelamentos_ativos: number;
  valor_total_pendente: number;
  parcelas_vencendo_mes: number;
  valor_vencendo_mes: number;
  parcelas_atrasadas: number;
  valor_atrasado: number;
}
