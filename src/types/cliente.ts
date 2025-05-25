
export type StatusCliente = 'Ativo' | 'Em análise' | 'Inativo' | 'A ativar' | 'Standby';

export type DiaSemana = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';

export type TipoLogisticaNome = 'Própria' | 'Distribuição';
export type TipoCobranca = 'À vista' | 'Consignado';
export type FormaPagamentoNome = 'Boleto' | 'PIX' | 'Dinheiro';

export type StatusAgendamentoCliente = 'Agendar' | 'Previsto' | 'Agendado' | 'Reagendar' | string;

export interface TipoLogistica {
  id: number;
  nome: string;
  percentualLogistico: number; // em porcentagem
  ativo: boolean;
}

export interface FormaPagamento {
  id: number;
  nome: string;
  ativo: boolean;
}

// Updated Cliente interface to match Supabase structure
export interface Cliente {
  id: string; // Changed from number to string for Supabase UUID
  nome: string;
  cnpj_cpf?: string;
  endereco_entrega?: string;
  contato_nome?: string;
  contato_telefone?: string;
  contato_email?: string;
  quantidade_padrao?: number;
  periodicidade_padrao?: number; // em dias
  status_cliente?: string;
  meta_giro_semanal?: number; // Meta de giro semanal
  ultima_data_reposicao_efetiva?: string; // Data da última reposição efetiva
  status_agendamento?: string; // Status do agendamento
  proxima_data_reposicao?: string; // Próxima data de reposição agendada
  ativo?: boolean;
  giro_medio_semanal?: number;
  
  // Novos campos para configuração avançada
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

// Legacy interface for backward compatibility
export interface ClienteLegacy {
  id: number;
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number;
  periodicidadePadrao: number; // em dias
  statusCliente: StatusCliente;
  dataCadastro: Date;
  metaGiroSemanal?: number; // Meta de giro semanal
  ultimaDataReposicaoEfetiva?: Date; // Data da última reposição efetiva
  statusAgendamento?: StatusAgendamentoCliente; // Status do agendamento
  proximaDataReposicao?: Date; // Próxima data de reposição agendada
  ativo: boolean;
  giroMedioSemanal?: number;
  
  // Novos campos para configuração avançada
  janelasEntrega?: DiaSemana[];
  representanteId?: number;
  rotaEntregaId?: number;
  categoriaEstabelecimentoId?: number;
  instrucoesEntrega?: string;
  contabilizarGiroMedio: boolean;
  tipoLogistica: TipoLogisticaNome;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  observacoes?: string;
  
  // New field for category selection
  categoriasHabilitadas?: number[]; // Array of category IDs that client can purchase
}

export interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

export interface RotaEntrega {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}
