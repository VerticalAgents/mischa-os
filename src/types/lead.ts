export type LeadStatus = 
  | 'Visitados' 
  | 'EfetivadosImediato' 
  | 'ContatosCapturados' 
  | 'ChamadosWhatsApp' 
  | 'RespostaWhatsApp' 
  | 'EfetivadosWhatsApp' 
  | 'Perdidos';

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
  'Visitados': 'Clientes Visitados',
  'EfetivadosImediato': 'Efetivados na Hora',
  'ContatosCapturados': 'Contatos Capturados',
  'ChamadosWhatsApp': 'Chamados no WhatsApp',
  'RespostaWhatsApp': 'Responderam WhatsApp',
  'EfetivadosWhatsApp': 'Efetivados WhatsApp',
  'Perdidos': 'Perdidos'
};

export const STATUS_COLORS: Record<LeadStatus, string> = {
  'Visitados': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  'EfetivadosImediato': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  'ContatosCapturados': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  'ChamadosWhatsApp': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  'RespostaWhatsApp': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  'EfetivadosWhatsApp': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  'Perdidos': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
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
