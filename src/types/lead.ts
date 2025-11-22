export type LeadStatus =
  // Estágio 1: Entrada
  | 'cadastrado'
  | 'visitado'

  // Estágio 2A: Follow-up WhatsApp
  | 'followup_wpp_pendente'
  | 'followup_wpp_tentativa'
  | 'followup_wpp_negociacao'

  // Estágio 2B: Follow-up Presencial
  | 'followup_presencial_pendente'
  | 'followup_presencial_tentativa'
  | 'followup_presencial_negociacao'

  // Estágio 3: Fechamento (Sucesso)
  | 'efetivado_imediato'
  | 'efetivado_wpp'
  | 'efetivado_presencial'

  // Estágio 4: Perda (Fim)
  | 'perdido_imediato'
  | 'perdido_wpp'
  | 'perdido_presencial';

export interface Lead {
  id: string;
  // Dados básicos (similares ao Cliente)
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  linkGoogleMaps?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  
  // Dados comerciais
  origem: string;
  status: LeadStatus;
  representanteId?: number;
  categoriaEstabelecimentoId?: number;
  
  // Configurações para conversão em cliente
  quantidadeEstimada?: number;
  periodicidadeEstimada?: number;
  
  // Histórico e observações
  observacoes?: string;
  dataVisita?: string;
  dataContatoWhatsApp?: string;
  dataResposta?: string;
  motivoPerda?: string;
  
  // Controle de conversão
  clienteConvertidoId?: string;
  dataConversao?: string;
  
  createdAt: string;
  updatedAt: string;
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  // Entrada
  'cadastrado': 'Cadastrado',
  'visitado': 'Visitado',
  
  // Follow-up WhatsApp
  'followup_wpp_pendente': '📱 WhatsApp Pendente',
  'followup_wpp_tentativa': '💬 WhatsApp Enviado',
  'followup_wpp_negociacao': '🤝 Negociando (WhatsApp)',
  
  // Follow-up Presencial
  'followup_presencial_pendente': '🚗 Retorno Pendente',
  'followup_presencial_tentativa': '🏢 Revisitado',
  'followup_presencial_negociacao': '🤝 Negociando (Presencial)',
  
  // Fechamento
  'efetivado_imediato': '✅ Fechado na Hora',
  'efetivado_wpp': '✅ Fechado WhatsApp',
  'efetivado_presencial': '✅ Fechado Presencial',
  
  // Perda
  'perdido_imediato': '❌ Perdido Imediato',
  'perdido_wpp': '❌ Perdido WhatsApp',
  'perdido_presencial': '❌ Perdido Presencial'
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  // Entrada - Azul claro
  'cadastrado': 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400',
  'visitado': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  
  // Follow-up Pendente (AÇÃO NECESSÁRIA) - Amarelo/Laranja
  'followup_wpp_pendente': 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-2 border-amber-500',
  'followup_presencial_pendente': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 border-2 border-orange-500',
  
  // Follow-up em Andamento (AGUARDANDO CLIENTE) - Roxo/Azul
  'followup_wpp_tentativa': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  'followup_wpp_negociacao': 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  'followup_presencial_tentativa': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  'followup_presencial_negociacao': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  
  // Fechamento (SUCESSO) - Verde
  'efetivado_imediato': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  'efetivado_wpp': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  'efetivado_presencial': 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
  
  // Perda (FRACASSO) - Vermelho/Cinza
  'perdido_imediato': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  'perdido_wpp': 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
  'perdido_presencial': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
};

// Helper para determinar categoria do status
export const getStatusCategory = (status: LeadStatus): 
  'entrada' | 'acao_necessaria' | 'aguardando_cliente' | 'sucesso' | 'fracasso' => {
  
  if (['cadastrado', 'visitado'].includes(status)) return 'entrada';
  
  if (['followup_wpp_pendente', 'followup_presencial_pendente'].includes(status)) {
    return 'acao_necessaria';
  }
  
  if ([
    'followup_wpp_tentativa', 'followup_wpp_negociacao',
    'followup_presencial_tentativa', 'followup_presencial_negociacao'
  ].includes(status)) {
    return 'aguardando_cliente';
  }
  
  if (status.startsWith('efetivado_')) return 'sucesso';
  if (status.startsWith('perdido_')) return 'fracasso';
  
  return 'entrada';
};

// Helper para determinar se lead tem contato WhatsApp capturado
export const temContatoCapturado = (lead: Lead): boolean => {
  return !!(lead.contatoTelefone && lead.contatoTelefone.trim() !== '');
};

// Helper para determinar o canal de follow-up
export const getCanalFollowup = (status: LeadStatus): 'wpp' | 'presencial' | null => {
  if (status.includes('_wpp_')) return 'wpp';
  if (status.includes('_presencial_')) return 'presencial';
  return null;
};

export const ORIGENS = [
  'Visita Presencial',
  'Indicação',
  'Telefone',
  'Email',
  'Redes Sociais',
  'Eventos',
  'Prospecção Ativa',
  'Site',
  'Outros'
];
