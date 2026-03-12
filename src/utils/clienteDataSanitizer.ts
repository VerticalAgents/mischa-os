import { Cliente } from '@/types';

interface SanitizationResult {
  data: any;
  corrections: string[];
  isValid: boolean;
  errors: string[];
  detectedTokens?: { field: string, tokens: string[] }[];
  originalData?: any;
  diff?: {
    before: any;
    after: any;
  };
}

// TOKENS PROBLEMÁTICOS - Lista abrangente de traduções automáticas detectadas
const PROBLEMATIC_TOKENS = [
  'customer_deleted', 'client_deleted', 'customer_inactive', 'customer_active',
  'customer_analysis', 'customer_pending', 'customer_standby', 'customer_activate',
  'client_inactive', 'client_active', 'client_analysis', 'client_pending',
  'user_deleted', 'user_inactive', 'user_active', 'deleted_customer',
  'inactive_customer', 'active_customer', 'pending_customer', 'standby_customer',
  'under_analysis', 'to_activate', 'activate', 'analysis', 'analyzing',
  'third_party', 'third-party', 'outsourced', 'bank_slip', 'credit_card',
  'debit_card', 'cash', 'installments', 'sight', 'prepaid', 'deferred'
];

// Mapeamentos de correção para valores traduzidos
const STATUS_CORRECTIONS = {
  'customer_deleted': 'Inativo',
  'customer_inactive': 'Inativo',
  'customer_active': 'Ativo',
  'customer_analysis': 'Em análise',
  'customer_pending': 'Em análise',
  'customer_standby': 'Standby',
  'customer_activate': 'A ativar',
  'client_deleted': 'Inativo',
  'client_inactive': 'Inativo',
  'client_active': 'Ativo',
  'client_analysis': 'Em análise',
  'client_pending': 'Em análise',
  'user_deleted': 'Inativo',
  'user_inactive': 'Inativo',
  'user_active': 'Ativo',
  'deleted_customer': 'Inativo',
  'inactive_customer': 'Inativo',
  'active_customer': 'Ativo',
  'pending_customer': 'Em análise',
  'standby_customer': 'Standby',
  'inactive': 'Inativo', 
  'active': 'Ativo',
  'under_analysis': 'Em análise',
  'to_activate': 'A ativar',
  'standby': 'Standby',
  'deleted': 'Inativo',
  'analysis': 'Em análise',
  'activate': 'A ativar',
  'pending': 'Em análise',
  'analyzing': 'Em análise'
};

const LOGISTICA_CORRECTIONS = {
  'own': 'Própria',
  'third_party': 'Terceirizada',
  'outsourced': 'Terceirizada',
  'third-party': 'Terceirizada',
  'self': 'Própria',
  'internal': 'Própria',
  'external': 'Terceirizada'
};

const COBRANCA_CORRECTIONS = {
  'cash': 'À vista',
  'installments': 'Parcelado',
  'term': 'A prazo',
  'sight': 'À vista',
  'prepaid': 'À vista',
  'deferred': 'A prazo'
};

const PAGAMENTO_CORRECTIONS = {
  'ticket': 'Boleto',
  'slip': 'Boleto',
  'bank_slip': 'Boleto',
  'credit_card': 'Cartão de crédito',
  'debit_card': 'Cartão de débito',
  'pix': 'PIX',
  'transfer': 'Transferência',
  'check': 'Cheque',
  'cash': 'Dinheiro'
};

// Valores válidos para validação - ATUALIZADOS PARA FORMATO CANÔNICO
const VALID_STATUS = ['ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY', 'REATIVAR'];
const VALID_LOGISTICA = ['PROPRIA', 'TERCEIRIZADA'];
const VALID_COBRANCA = ['A_VISTA', 'PARCELADO', 'A_PRAZO', 'CONSIGNADO'];
const VALID_PAGAMENTO = ['BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'];
const VALID_TIPO_PESSOA = ['PF', 'PJ'];

// Mapear valores antigos para novos valores canônicos
const STATUS_TO_CANONICAL = {
  'Ativo': 'ATIVO',
  'Inativo': 'INATIVO', 
  'Em análise': 'EM_ANALISE',
  'A ativar': 'A_ATIVAR',
  'Standby': 'STANDBY',
  'Reativar': 'REATIVAR'
};

const LOGISTICA_TO_CANONICAL = {
  'Própria': 'PROPRIA',
  'Terceirizada': 'TERCEIRIZADA'
};

const COBRANCA_TO_CANONICAL = {
  'À vista': 'A_VISTA',
  'Parcelado': 'PARCELADO',
  'A prazo': 'A_PRAZO',
  'Consignado': 'CONSIGNADO'
};

const PAGAMENTO_TO_CANONICAL = {
  'Boleto': 'BOLETO',
  'PIX': 'PIX',
  'Dinheiro': 'DINHEIRO',
  'Cartão de crédito': 'CARTAO_CREDITO',
  'Cartão de débito': 'CARTAO_DEBITO'
};

// Helpers para transformação segura de dados
const intOrNull = (v: any): number | null => {
  if (v === undefined || v === null || v === '' || v === 'undefined' || Number.isNaN(Number(v))) return null;
  const parsed = parseInt(String(v), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const numOrNull = (v: any): number | null => {
  if (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) return null;
  return Number(v);
};

const boolOr = (v: any, fallback = false): boolean => {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
};

const arrJson = (v: any): any[] => {
  if (Array.isArray(v)) return v;
  if (v === null || v === undefined) return [];
  return [];
};

const arrNum = (v: any): number[] => {
  if (!Array.isArray(v)) return [];
  return v.map((x) => Number(x)).filter(Number.isFinite);
};

// Função para detectar tokens problemáticos em qualquer campo string
const detectProblematicTokens = (value: any): string[] => {
  if (!value || typeof value !== 'string') return [];
  
  const lowerValue = value.toLowerCase();
  return PROBLEMATIC_TOKENS.filter(token => 
    lowerValue.includes(token.toLowerCase())
  );
};

// Função de limpeza agressiva para campos corrompidos
const cleanCorruptedField = (value: any, fieldName: string): { cleaned: any, wasCorrupted: boolean, tokens: string[] } => {
  const tokens = detectProblematicTokens(value);
  const wasCorrupted = tokens.length > 0;
  
  if (wasCorrupted) {
    console.warn(`🧹 Campo ${fieldName} contém tokens problemáticos:`, tokens);
    
    // Reset para valor seguro baseado no tipo de campo
    const safeDefaults = {
      'statusCliente': 'Ativo',
      'tipoLogistica': 'Própria', 
      'tipoCobranca': 'À vista',
      'formaPagamento': 'Boleto',
      'nome': '',
      'enderecoEntrega': '',
      'linkGoogleMaps': '',
      'contatoNome': '',
      'contatoTelefone': '',
      'contatoEmail': '',
      'instrucoesEntrega': '',
      'observacoes': ''
    };
    
    return {
      cleaned: safeDefaults[fieldName] || '',
      wasCorrupted: true,
      tokens
    };
  }
  
  return {
    cleaned: value,
    wasCorrupted: false, 
    tokens: []
  };
};

// Função de reset completo para casos extremos
export function createSafeClienteDefaults(): Partial<Cliente> {
  return {
    statusCliente: 'Ativo',
    tipoLogistica: 'Própria',
    tipoCobranca: 'À vista', 
    formaPagamento: 'Boleto',
    prazoPagamentoDias: 7,
    categoriasHabilitadas: [],
    janelasEntrega: [],
    quantidadePadrao: 0,
    periodicidadePadrao: 7,
    metaGiroSemanal: 0,
    giroMedioSemanal: 0,
    ativo: true,
    contabilizarGiroMedio: true,
    emiteNotaFiscal: true
  };
}

/**
 * Sanitiza e valida dados de cliente antes do envio ao banco
 */
export function sanitizeClienteData(data: Partial<Cliente>): SanitizationResult {
  const corrections: string[] = [];
  const errors: string[] = [];
  let isValid = true;
  const detectedTokens: { field: string, tokens: string[] }[] = [];

  console.log('🔧 Sanitizando dados do cliente:', data);
  console.log('🔍 PAYLOAD ORIGINAL (antes da sanitização):', JSON.stringify(data, null, 2));

  // Criar cópia dos dados para sanitização
  const sanitized = { ...data };
  
  // 0. INTERCEPTAÇÃO AGRESSIVA - Verificar tokens problemáticos em TODOS os campos
  const allFields = [
    'nome', 'cnpjCpf', 'inscricaoEstadual', 'enderecoEntrega', 'linkGoogleMaps', 'contatoNome',
    'contatoTelefone', 'contatoEmail', 'instrucoesEntrega', 'observacoes',
    'statusCliente', 'tipoLogistica', 'tipoCobranca', 'formaPagamento', 'tipoPessoa'
  ];
  
  allFields.forEach(field => {
    if (sanitized[field]) {
      const { cleaned, wasCorrupted, tokens } = cleanCorruptedField(sanitized[field], field);
      
      if (wasCorrupted) {
        detectedTokens.push({ field, tokens });
        sanitized[field] = cleaned;
        corrections.push(`🧹 Campo ${field}: Tokens problemáticos removidos [${tokens.join(', ')}]`);
        console.warn(`🚨 INTERCEPTADO: Campo ${field} continha tokens problemáticos:`, tokens);
      }
    }
  });

  // 1. Sanitizar campos de texto básicos
  if (sanitized.nome) {
    sanitized.nome = sanitized.nome.toString().trim();
  }
  if (sanitized.tipoPessoa) {
    const tipoPessoaUpper = sanitized.tipoPessoa.toString().trim().toUpperCase();
    sanitized.tipoPessoa = (tipoPessoaUpper === 'PF' || tipoPessoaUpper === 'PJ') ? tipoPessoaUpper as any : 'PJ';
  } else {
    sanitized.tipoPessoa = 'PJ' as any; // Default para PJ
  }
  if (sanitized.cnpjCpf) {
    sanitized.cnpjCpf = sanitized.cnpjCpf.toString().trim();
  }
  if (sanitized.inscricaoEstadual) {
    // Inscrição estadual só faz sentido para PJ
    if (sanitized.tipoPessoa === 'PJ') {
      sanitized.inscricaoEstadual = sanitized.inscricaoEstadual.toString().trim();
    } else {
      sanitized.inscricaoEstadual = undefined; // Limpar IE para PF
    }
  }
  if (sanitized.enderecoEntrega) {
    sanitized.enderecoEntrega = sanitized.enderecoEntrega.toString().trim();
  }
  if (sanitized.linkGoogleMaps) {
    sanitized.linkGoogleMaps = sanitized.linkGoogleMaps.toString().trim();
  }
  if (sanitized.contatoNome) {
    sanitized.contatoNome = sanitized.contatoNome.toString().trim();
  }
  if (sanitized.contatoTelefone) {
    sanitized.contatoTelefone = sanitized.contatoTelefone.toString().trim();
  }
  if (sanitized.contatoEmail) {
    sanitized.contatoEmail = sanitized.contatoEmail.toString().trim();
  }
  if (sanitized.instrucoesEntrega) {
    sanitized.instrucoesEntrega = sanitized.instrucoesEntrega.toString().trim();
  }
  if (sanitized.observacoes) {
    sanitized.observacoes = sanitized.observacoes.toString().trim();
  }

  // 2. Corrigir e validar status_cliente - CONVERTER PARA CANÔNICO
  let canonicalStatus = 'ATIVO';
  if (sanitized.statusCliente) {
    const originalStatus = sanitized.statusCliente;
    const statusKey = originalStatus.toLowerCase();

    // Primeiro, tentar corrigir tokens problemáticos
    if (STATUS_CORRECTIONS[statusKey]) {
      canonicalStatus = STATUS_TO_CANONICAL[STATUS_CORRECTIONS[statusKey]] || 'ATIVO';
      corrections.push(`Status corrigido: ${originalStatus} → ${canonicalStatus}`);
    } else if (STATUS_TO_CANONICAL[originalStatus]) {
      canonicalStatus = STATUS_TO_CANONICAL[originalStatus];
      corrections.push(`Status canonizado: ${originalStatus} → ${canonicalStatus}`);
    } else if (VALID_STATUS.includes(originalStatus as any)) {
      canonicalStatus = originalStatus as any;
    } else {
      canonicalStatus = 'ATIVO';
      errors.push(`Status inválido "${originalStatus}", usando padrão "ATIVO"`);
      isValid = false;
    }
  }
  sanitized.statusCliente = canonicalStatus as any;

  // 3. Corrigir e validar tipo_logistica - CONVERTER PARA CANÔNICO
  let canonicalLogistica = 'PROPRIA';
  if (sanitized.tipoLogistica) {
    const originalLogistica = sanitized.tipoLogistica;
    const logisticaKey = originalLogistica.toLowerCase();

    if (LOGISTICA_CORRECTIONS[logisticaKey]) {
      canonicalLogistica = LOGISTICA_TO_CANONICAL[LOGISTICA_CORRECTIONS[logisticaKey]] || 'PROPRIA';
      corrections.push(`Logística corrigida: ${originalLogistica} → ${canonicalLogistica}`);
    } else if (LOGISTICA_TO_CANONICAL[originalLogistica]) {
      canonicalLogistica = LOGISTICA_TO_CANONICAL[originalLogistica];
      corrections.push(`Logística canonizada: ${originalLogistica} → ${canonicalLogistica}`);
    } else if (VALID_LOGISTICA.includes(originalLogistica as any)) {
      canonicalLogistica = originalLogistica as any;
    } else {
      // Aceitar valor customizado do usuário (tipo cadastrado na tabela tipos_logistica)
      canonicalLogistica = originalLogistica;
      corrections.push(`Logística customizada aceita: "${originalLogistica}"`);
    }
  }
  sanitized.tipoLogistica = canonicalLogistica as any;

  // 4. Corrigir e validar tipo_cobranca - CONVERTER PARA CANÔNICO
  let canonicalCobranca = 'A_VISTA';
  if (sanitized.tipoCobranca) {
    const originalCobranca = sanitized.tipoCobranca;
    const cobrancaKey = originalCobranca.toLowerCase();

    if (COBRANCA_CORRECTIONS[cobrancaKey]) {
      canonicalCobranca = COBRANCA_TO_CANONICAL[COBRANCA_CORRECTIONS[cobrancaKey]] || 'A_VISTA';
      corrections.push(`Cobrança corrigida: ${originalCobranca} → ${canonicalCobranca}`);
    } else if (COBRANCA_TO_CANONICAL[originalCobranca]) {
      canonicalCobranca = COBRANCA_TO_CANONICAL[originalCobranca];
      corrections.push(`Cobrança canonizada: ${originalCobranca} → ${canonicalCobranca}`);
    } else if (VALID_COBRANCA.includes(originalCobranca as any)) {
      canonicalCobranca = originalCobranca as any;
    } else {
      // Aceitar valor customizado do usuário (tipo cadastrado na tabela tipos_cobranca)
      canonicalCobranca = originalCobranca;
      corrections.push(`Cobrança customizada aceita: "${originalCobranca}"`);
    }
  }
  sanitized.tipoCobranca = canonicalCobranca as any;

  // 5. Corrigir e validar forma_pagamento - CONVERTER PARA CANÔNICO
  let canonicalPagamento = 'BOLETO';
  if (sanitized.formaPagamento) {
    const originalPagamento = sanitized.formaPagamento;
    const pagamentoKey = originalPagamento.toLowerCase();

    if (PAGAMENTO_CORRECTIONS[pagamentoKey]) {
      canonicalPagamento = PAGAMENTO_TO_CANONICAL[PAGAMENTO_CORRECTIONS[pagamentoKey]] || 'BOLETO';
      corrections.push(`Pagamento corrigido: ${originalPagamento} → ${canonicalPagamento}`);
    } else if (PAGAMENTO_TO_CANONICAL[originalPagamento]) {
      canonicalPagamento = PAGAMENTO_TO_CANONICAL[originalPagamento];
      corrections.push(`Pagamento canonizado: ${originalPagamento} → ${canonicalPagamento}`);
    } else if (VALID_PAGAMENTO.includes(originalPagamento as any)) {
      canonicalPagamento = originalPagamento as any;
    } else {
      // Aceitar valor customizado do usuário (tipo cadastrado na tabela formas_pagamento)
      canonicalPagamento = originalPagamento;
      corrections.push(`Pagamento customizado aceito: "${originalPagamento}"`);
    }
  }
  sanitized.formaPagamento = canonicalPagamento as any;

  // 6. Sanitizar arrays e valores numéricos - COM VALIDAÇÃO RIGOROSA
  console.log('🔍 Valores originais antes da sanitização de arrays:', {
    categoriasHabilitadas: sanitized.categoriasHabilitadas,
    janelasEntrega: sanitized.janelasEntrega
  });

  // Garantir que categorias_habilitadas é sempre um array válido de números
  if (sanitized.categoriasHabilitadas === null || sanitized.categoriasHabilitadas === undefined) {
    sanitized.categoriasHabilitadas = [];
  } else if (!Array.isArray(sanitized.categoriasHabilitadas)) {
    console.warn('🚨 categoriasHabilitadas não é array:', sanitized.categoriasHabilitadas);
    sanitized.categoriasHabilitadas = [];
  } else {
    // Filtrar apenas números válidos
    sanitized.categoriasHabilitadas = sanitized.categoriasHabilitadas
      .map(item => {
        const num = Number(item);
        return Number.isFinite(num) ? num : null;
      })
      .filter(item => item !== null);
  }

  // Garantir que janelas_entrega é sempre um array válido
  if (sanitized.janelasEntrega === null || sanitized.janelasEntrega === undefined) {
    sanitized.janelasEntrega = [];
  } else if (!Array.isArray(sanitized.janelasEntrega)) {
    console.warn('🚨 janelasEntrega não é array:', sanitized.janelasEntrega);
    sanitized.janelasEntrega = [];
  }

  console.log('✅ Valores sanitizados de arrays:', {
    categoriasHabilitadas: sanitized.categoriasHabilitadas,
    janelasEntrega: sanitized.janelasEntrega
  });
  sanitized.quantidadePadrao = intOrNull(sanitized.quantidadePadrao) ?? 0;
  sanitized.periodicidadePadrao = intOrNull(sanitized.periodicidadePadrao) ?? 7;
  sanitized.metaGiroSemanal = numOrNull(sanitized.metaGiroSemanal) ?? 0;
  sanitized.giroMedioSemanal = numOrNull(sanitized.giroMedioSemanal) ?? 0;
  sanitized.representanteId = intOrNull(sanitized.representanteId);
  sanitized.rotaEntregaId = intOrNull(sanitized.rotaEntregaId);
  sanitized.categoriaEstabelecimentoId = intOrNull(sanitized.categoriaEstabelecimentoId);
  sanitized.prazoPagamentoDias = intOrNull(sanitized.prazoPagamentoDias) ?? 7;

  // 7. Sanitizar valores booleanos
  sanitized.ativo = boolOr(sanitized.ativo, true);
  sanitized.contabilizarGiroMedio = boolOr(sanitized.contabilizarGiroMedio, true);
  sanitized.emiteNotaFiscal = boolOr(sanitized.emiteNotaFiscal, true);

  // 8. Validar campos obrigatórios
  if (!sanitized.nome || sanitized.nome === '') {
    errors.push('Nome é obrigatório');
    isValid = false;
  }

  // 9. Transformar para formato do banco de dados com validação extra
  console.log('🔄 Transformando para formato do banco:', {
    categoriasHabilitadas: sanitized.categoriasHabilitadas,
    janelasEntrega: sanitized.janelasEntrega
  });

  // Garantir que arrays estão no formato correto para JSONB
  const categoriasSeguras = Array.isArray(sanitized.categoriasHabilitadas) 
    ? sanitized.categoriasHabilitadas 
    : [];
  
  const janelasSeguras = Array.isArray(sanitized.janelasEntrega) 
    ? sanitized.janelasEntrega 
    : [];

  console.log('🛡️ Arrays seguros para JSONB:', {
    categoriasSeguras,
    janelasSeguras
  });

  // Validar tipoPessoa
  let tipoPessoaFinal = 'PJ';
  if (sanitized.tipoPessoa && VALID_TIPO_PESSOA.includes(sanitized.tipoPessoa as string)) {
    tipoPessoaFinal = sanitized.tipoPessoa as string;
  }

  const dbData = {
    nome: sanitized.nome || '',
    tipo_pessoa: tipoPessoaFinal,
    cnpj_cpf: sanitized.cnpjCpf || null,
    inscricao_estadual: tipoPessoaFinal === 'PJ' ? (sanitized.inscricaoEstadual || null) : null,
    endereco_entrega: sanitized.enderecoEntrega || null,
    link_google_maps: sanitized.linkGoogleMaps || null,
    contato_nome: sanitized.contatoNome || null,
    contato_telefone: sanitized.contatoTelefone || null,
    contato_email: sanitized.contatoEmail || null,
    representante_id: sanitized.representanteId,
    rota_entrega_id: sanitized.rotaEntregaId,
    categoria_estabelecimento_id: sanitized.categoriaEstabelecimentoId,
    quantidade_padrao: sanitized.quantidadePadrao,
    periodicidade_padrao: sanitized.periodicidadePadrao,
    meta_giro_semanal: sanitized.metaGiroSemanal,
    giro_medio_semanal: sanitized.giroMedioSemanal,
    janelas_entrega: janelasSeguras,
    categorias_habilitadas: categoriasSeguras,
    status_cliente: sanitized.statusCliente,
    ultima_data_reposicao_efetiva: sanitized.ultimaDataReposicaoEfetiva?.toISOString?.() || null,
    proxima_data_reposicao: sanitized.proximaDataReposicao?.toISOString?.() || null,
    ativo: sanitized.ativo,
    contabilizar_giro_medio: sanitized.contabilizarGiroMedio,
    emite_nota_fiscal: sanitized.emiteNotaFiscal,
    instrucoes_entrega: sanitized.instrucoesEntrega || null,
    observacoes: sanitized.observacoes || null,
    tipo_logistica: sanitized.tipoLogistica,
    tipo_cobranca: sanitized.tipoCobranca,
    forma_pagamento: sanitized.formaPagamento,
    prazo_pagamento_dias: sanitized.prazoPagamentoDias,
    gestaoclick_cliente_id: sanitized.gestaoClickClienteId || null,
    desabilitar_reagendamento: boolOr(sanitized.desabilitarReagendamento, false),
    updated_at: new Date().toISOString(),
  };

  // LOG DETALHADO DO PAYLOAD FINAL
  console.log('📊 DIFF SANITIZAÇÃO - ANTES vs DEPOIS:');
  console.log('ANTES:', {
    statusCliente: data.statusCliente,
    tipoLogistica: data.tipoLogistica, 
    tipoCobranca: data.tipoCobranca,
    formaPagamento: data.formaPagamento,
    categoriasHabilitadas: data.categoriasHabilitadas,
    janelasEntrega: data.janelasEntrega
  });
  console.log('DEPOIS:', {
    status_cliente: dbData.status_cliente,
    tipo_logistica: dbData.tipo_logistica,
    tipo_cobranca: dbData.tipo_cobranca,
    forma_pagamento: dbData.forma_pagamento,
    categorias_habilitadas: dbData.categorias_habilitadas,
    janelas_entrega: dbData.janelas_entrega
  });

  console.log('✅ PAYLOAD FINAL PARA SUPABASE:', JSON.stringify(dbData, null, 2));
  console.log('📋 CORREÇÕES APLICADAS:', corrections);
  console.log('❌ ERROS DETECTADOS:', errors);
  console.log('🚨 TOKENS PROBLEMÁTICOS ENCONTRADOS:', detectedTokens);

  // Validação final dos campos JSONB
  try {
    JSON.stringify(dbData.categorias_habilitadas);
    JSON.stringify(dbData.janelas_entrega);
    console.log('✅ Validação JSON passou para ambos os arrays');
  } catch (jsonError) {
    console.error('❌ Erro na validação JSON:', jsonError);
    errors.push('Erro na validação de dados JSON');
    isValid = false;
  }

  return {
    data: dbData,
    corrections,
    isValid,
    errors,
    detectedTokens, // Adicionar tokens detectados ao retorno
    originalData: data, // Manter dados originais para comparação
    diff: {
      before: {
        statusCliente: data.statusCliente,
        tipoLogistica: data.tipoLogistica,
        tipoCobranca: data.tipoCobranca,
        formaPagamento: data.formaPagamento
      },
      after: {
        status_cliente: dbData.status_cliente,
        tipo_logistica: dbData.tipo_logistica,
        tipo_cobranca: dbData.tipo_cobranca,
        forma_pagamento: dbData.forma_pagamento
      }
    }
  };
}