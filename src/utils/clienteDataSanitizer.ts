import { Cliente } from '@/types';

interface SanitizationResult {
  data: any;
  corrections: string[];
  isValid: boolean;
  errors: string[];
}

// Mapeamentos de correção para valores traduzidos
const STATUS_CORRECTIONS = {
  'customer_deleted': 'Inativo',
  'inactive': 'Inativo', 
  'active': 'Ativo',
  'under_analysis': 'Em análise',
  'to_activate': 'A ativar',
  'standby': 'Standby',
  'deleted': 'Inativo',
  'client_deleted': 'Inativo',
  'customer_inactive': 'Inativo',
  'customer_active': 'Ativo',
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

// Valores válidos para validação
const VALID_STATUS = ['Ativo', 'Inativo', 'Em análise', 'A ativar', 'Standby'];
const VALID_LOGISTICA = ['Própria', 'Terceirizada'];
const VALID_COBRANCA = ['À vista', 'Parcelado', 'A prazo'];
const VALID_PAGAMENTO = ['Boleto', 'Cartão de crédito', 'Cartão de débito', 'PIX', 'Transferência', 'Cheque', 'Dinheiro'];

// Helpers para transformação segura de dados
const intOrNull = (v: any): number | null => {
  if (v === undefined || v === null || v === '' || Number.isNaN(Number(v))) return null;
  return parseInt(String(v), 10);
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

/**
 * Sanitiza e valida dados de cliente antes do envio ao banco
 */
export function sanitizeClienteData(data: Partial<Cliente>): SanitizationResult {
  const corrections: string[] = [];
  const errors: string[] = [];
  let isValid = true;

  console.log('🔧 Sanitizando dados do cliente:', data);

  // Criar cópia dos dados para sanitização
  const sanitized = { ...data };

  // 1. Sanitizar campos de texto básicos
  if (sanitized.nome) {
    sanitized.nome = sanitized.nome.toString().trim();
  }
  if (sanitized.cnpjCpf) {
    sanitized.cnpjCpf = sanitized.cnpjCpf.toString().trim();
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

  // 2. Corrigir e validar status_cliente
  if (sanitized.statusCliente) {
    const originalStatus = sanitized.statusCliente;
    const statusKey = originalStatus.toLowerCase();

    if (STATUS_CORRECTIONS[statusKey]) {
      sanitized.statusCliente = STATUS_CORRECTIONS[statusKey];
      corrections.push(`Status: ${originalStatus} → ${sanitized.statusCliente}`);
    }

    if (!VALID_STATUS.includes(sanitized.statusCliente)) {
      sanitized.statusCliente = 'Ativo';
      errors.push(`Status inválido "${originalStatus}", usando padrão "Ativo"`);
      isValid = false;
    }
  } else {
    sanitized.statusCliente = 'Ativo';
  }

  // 3. Corrigir e validar tipo_logistica
  if (sanitized.tipoLogistica) {
    const originalLogistica = sanitized.tipoLogistica;
    const logisticaKey = originalLogistica.toLowerCase();

    if (LOGISTICA_CORRECTIONS[logisticaKey]) {
      sanitized.tipoLogistica = LOGISTICA_CORRECTIONS[logisticaKey];
      corrections.push(`Logística: ${originalLogistica} → ${sanitized.tipoLogistica}`);
    }

    if (!VALID_LOGISTICA.includes(sanitized.tipoLogistica)) {
      sanitized.tipoLogistica = 'Própria';
      errors.push(`Logística inválida "${originalLogistica}", usando padrão "Própria"`);
      isValid = false;
    }
  } else {
    sanitized.tipoLogistica = 'Própria';
  }

  // 4. Corrigir e validar tipo_cobranca
  if (sanitized.tipoCobranca) {
    const originalCobranca = sanitized.tipoCobranca;
    const cobrancaKey = originalCobranca.toLowerCase();

    if (COBRANCA_CORRECTIONS[cobrancaKey]) {
      sanitized.tipoCobranca = COBRANCA_CORRECTIONS[cobrancaKey];
      corrections.push(`Cobrança: ${originalCobranca} → ${sanitized.tipoCobranca}`);
    }

    if (!VALID_COBRANCA.includes(sanitized.tipoCobranca)) {
      sanitized.tipoCobranca = 'À vista';
      errors.push(`Cobrança inválida "${originalCobranca}", usando padrão "À vista"`);
      isValid = false;
    }
  } else {
    sanitized.tipoCobranca = 'À vista';
  }

  // 5. Corrigir e validar forma_pagamento
  if (sanitized.formaPagamento) {
    const originalPagamento = sanitized.formaPagamento;
    const pagamentoKey = originalPagamento.toLowerCase();

    if (PAGAMENTO_CORRECTIONS[pagamentoKey]) {
      sanitized.formaPagamento = PAGAMENTO_CORRECTIONS[pagamentoKey];
      corrections.push(`Pagamento: ${originalPagamento} → ${sanitized.formaPagamento}`);
    }

    if (!VALID_PAGAMENTO.includes(sanitized.formaPagamento)) {
      sanitized.formaPagamento = 'Boleto';
      errors.push(`Pagamento inválido "${originalPagamento}", usando padrão "Boleto"`);
      isValid = false;
    }
  } else {
    sanitized.formaPagamento = 'Boleto';
  }

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

  // 7. Sanitizar valores booleanos
  sanitized.ativo = boolOr(sanitized.ativo, true);
  sanitized.contabilizarGiroMedio = boolOr(sanitized.contabilizarGiroMedio, true);
  sanitized.emiteNotaFiscal = boolOr(sanitized.emiteNotaFiscal, true);

  // 8. Validar campos obrigatórios
  if (!sanitized.nome || sanitized.nome === '') {
    errors.push('Nome é obrigatório');
    isValid = false;
  }
  if (!sanitized.enderecoEntrega || sanitized.enderecoEntrega === '') {
    errors.push('Endereço de entrega é obrigatório');
    isValid = false;
  }
  if (!sanitized.linkGoogleMaps || sanitized.linkGoogleMaps === '') {
    errors.push('Link do Google Maps é obrigatório');
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
  const dbData = {
    nome: sanitized.nome || '',
    cnpj_cpf: sanitized.cnpjCpf || null,
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
    updated_at: new Date().toISOString(),
  };

  console.log('✅ Payload final para o banco de dados:', {
    nome: dbData.nome,
    status_cliente: dbData.status_cliente,
    tipo_logistica: dbData.tipo_logistica,
    tipo_cobranca: dbData.tipo_cobranca,
    forma_pagamento: dbData.forma_pagamento,
    categorias_habilitadas: dbData.categorias_habilitadas,
    janelas_entrega: dbData.janelas_entrega,
    corrections: corrections.length,
    errors: errors.length,
    isValid
  });

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
    errors
  };
}