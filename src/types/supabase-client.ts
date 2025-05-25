
// Types that match the Supabase database structure
export interface ClienteSupabase {
  id: string;
  nome: string;
  cnpj_cpf?: string;
  endereco_entrega?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  quantidade_padrao?: number;
  periodicidade_padrao?: number;
  status_cliente?: string;
  meta_giro_semanal?: number;
  ultima_data_reposicao_efetiva?: string;
  proxima_data_reposicao?: string;
  status_agendamento?: string;
  ativo?: boolean;
  giro_medio_semanal?: number;
  janelas_entrega?: any;
  representante_id?: number;
  rota_entrega_id?: number;
  categoria_estabelecimento_id?: number;
  instrucoes_entrega?: string;
  contabilizar_giro_medio?: boolean;
  tipo_logistica?: string;
  emite_nota_fiscal?: boolean;
  tipo_cobranca?: string;
  forma_pagamento?: string;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}
