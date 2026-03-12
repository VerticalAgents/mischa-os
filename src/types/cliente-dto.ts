import { z } from 'zod';

// Enums canônicos para domínios de cliente
export const StatusCliente = z.enum(['ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY', 'REATIVAR']);
export const TipoLogistica = z.enum(['PROPRIA', 'TERCEIRIZADA']);
export const TipoCobranca = z.enum(['A_VISTA', 'PARCELADO', 'A_PRAZO']);
export const FormaPagamento = z.enum(['BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO']);
export const TipoPessoa = z.enum(['PF', 'PJ']);

// Tipos derivados dos enums
export type StatusClienteType = z.infer<typeof StatusCliente>;
export type TipoLogisticaType = z.infer<typeof TipoLogistica>;
export type TipoCobrancaType = z.infer<typeof TipoCobranca>;
export type FormaPagamentoType = z.infer<typeof FormaPagamento>;
export type TipoPessoaType = z.infer<typeof TipoPessoa>;

// Schema completo do DTO do cliente
export const ClienteDTO = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipoPessoa: TipoPessoa.default('PJ'),
  cnpjCpf: z.string().optional(),
  inscricaoEstadual: z.string().optional(),
  enderecoEntrega: z.string().optional(),
  linkGoogleMaps: z.string().optional(),
  contatoNome: z.string().optional(),
  contatoTelefone: z.string().optional(),
  contatoEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  quantidadePadrao: z.number().min(0).optional(),
  periodicidadePadrao: z.number().min(1).optional(),
  statusCliente: StatusCliente,
  tipoLogistica: TipoLogistica,
  tipoCobranca: TipoCobranca,
  formaPagamento: FormaPagamento,
  emiteNotaFiscal: z.boolean().optional(),
  contabilizarGiroMedio: z.boolean().optional(),
  observacoes: z.string().optional(),
  categoriasHabilitadas: z.array(z.number()).optional(),
  janelasEntrega: z.array(z.string()).optional(),
  representanteId: z.number().optional(),
  rotaEntregaId: z.number().optional(),
  categoriaEstabelecimentoId: z.number().optional(),
  instrucoesEntrega: z.string().optional(),
  ativo: z.boolean().optional(),
});

export type ClienteDTOType = z.infer<typeof ClienteDTO>;

// Mapeamentos canônicos para evitar uso de labels como valores
export const STATUS_CLIENTE_MAP: Record<string, StatusClienteType> = {
  'Ativo': 'ATIVO',
  'Inativo': 'INATIVO',
  'Em análise': 'EM_ANALISE',
  'A ativar': 'A_ATIVAR',
  'Standby': 'STANDBY',
  'Reativar': 'REATIVAR',
  // Tokens corrompidos conhecidos
  'customer_deleted': 'INATIVO',
  'client_inactive': 'INATIVO',
  'inactive': 'INATIVO',
  'deleted': 'INATIVO',
  'user_active': 'ATIVO',
  'active': 'ATIVO',
};

export const TIPO_LOGISTICA_MAP: Record<string, TipoLogisticaType> = {
  'Própria': 'PROPRIA',
  'Terceirizada': 'TERCEIRIZADA',
  'Own': 'PROPRIA',
  'Third-party': 'TERCEIRIZADA',
};

export const TIPO_COBRANCA_MAP: Record<string, TipoCobrancaType> = {
  'À vista': 'A_VISTA',
  'Parcelado': 'PARCELADO',
  'A prazo': 'A_PRAZO',
  'Cash': 'A_VISTA',
  'Installment': 'PARCELADO',
  'Term': 'A_PRAZO',
};

export const FORMA_PAGAMENTO_MAP: Record<string, FormaPagamentoType> = {
  'Boleto': 'BOLETO',
  'PIX': 'PIX',
  'Dinheiro': 'DINHEIRO',
  'Cartão de crédito': 'CARTAO_CREDITO',
  'Cartão de débito': 'CARTAO_DEBITO',
  'Bank slip': 'BOLETO',
  'Cash': 'DINHEIRO',
  'Credit card': 'CARTAO_CREDITO',
  'Debit card': 'CARTAO_DEBITO',
};

// Labels para display na UI (apenas visual, nunca como value)
export const STATUS_CLIENTE_LABELS: Record<StatusClienteType, string> = {
  'ATIVO': 'Ativo',
  'INATIVO': 'Inativo',
  'EM_ANALISE': 'Em análise',
  'A_ATIVAR': 'A ativar',
  'STANDBY': 'Standby',
  'REATIVAR': 'Reativar',
};

export const TIPO_LOGISTICA_LABELS: Record<TipoLogisticaType, string> = {
  'PROPRIA': 'Própria',
  'TERCEIRIZADA': 'Terceirizada',
};

export const TIPO_COBRANCA_LABELS: Record<TipoCobrancaType, string> = {
  'A_VISTA': 'À vista',
  'PARCELADO': 'Parcelado',
  'A_PRAZO': 'A prazo',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamentoType, string> = {
  'BOLETO': 'Boleto',
  'PIX': 'PIX',
  'DINHEIRO': 'Dinheiro',
  'CARTAO_CREDITO': 'Cartão de crédito',
  'CARTAO_DEBITO': 'Cartão de débito',
};

export const TIPO_PESSOA_LABELS: Record<TipoPessoaType, string> = {
  'PF': 'Pessoa Física',
  'PJ': 'Pessoa Jurídica',
};

// Função para normalizar tokens corrompidos (feature flag)
export function normalizarTokensCliente(input: any): any {
  if (!process.env.SANEAR_TOKENS_TRANSLACAO || process.env.SANEAR_TOKENS_TRANSLACAO !== 'true') {
    return input;
  }

  const output = { ...input };
  
  if (typeof output.statusCliente === 'string' && STATUS_CLIENTE_MAP[output.statusCliente]) {
    const original = output.statusCliente;
    output.statusCliente = STATUS_CLIENTE_MAP[output.statusCliente];
    console.warn('🔧 Token normalizado:', { field: 'statusCliente', original, normalized: output.statusCliente });
  }
  
  if (typeof output.tipoLogistica === 'string' && TIPO_LOGISTICA_MAP[output.tipoLogistica]) {
    const original = output.tipoLogistica;
    output.tipoLogistica = TIPO_LOGISTICA_MAP[output.tipoLogistica];
    console.warn('🔧 Token normalizado:', { field: 'tipoLogistica', original, normalized: output.tipoLogistica });
  }
  
  if (typeof output.tipoCobranca === 'string' && TIPO_COBRANCA_MAP[output.tipoCobranca]) {
    const original = output.tipoCobranca;
    output.tipoCobranca = TIPO_COBRANCA_MAP[output.tipoCobranca];
    console.warn('🔧 Token normalizado:', { field: 'tipoCobranca', original, normalized: output.tipoCobranca });
  }
  
  if (typeof output.formaPagamento === 'string' && FORMA_PAGAMENTO_MAP[output.formaPagamento]) {
    const original = output.formaPagamento;
    output.formaPagamento = FORMA_PAGAMENTO_MAP[output.formaPagamento];
    console.warn('🔧 Token normalizado:', { field: 'formaPagamento', original, normalized: output.formaPagamento });
  }

  return output;
}