export interface ItemVendaGC {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria_id?: number;
  ordem_categoria?: number;
}

export type NfStatus = 'em_aberto' | 'emitida' | null;

export interface VendaGC {
  id: string; // agendamento_id
  gestaoclick_venda_id: string;
  gestaoclick_sincronizado_em: string;
  gestaoclick_nf_id?: string; // ID da NF gerada no GestaoClick
  gestaoclick_nf_status?: NfStatus; // Status da NF: em_aberto, emitida, ou null
  cliente_id: string;
  cliente_nome: string;
  cliente_razao_social?: string;
  cliente_cnpj_cpf?: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  cliente_email?: string;
  forma_pagamento: string;
  tipo_cobranca: string;
  prazo_pagamento_dias: number;
  data_proxima_reposicao: string;
  quantidade_total: number;
  itens: ItemVendaGC[];
  valor_total: number;
  data_vencimento: string;
  // Observações e trocas
  observacoes_gerais?: string;
  observacoes_agendamento?: string;
  trocas_pendentes?: { produto_nome: string; quantidade: number; motivo_nome: string }[];
  // Status dos documentos (estado local)
  documentoA4Gerado?: boolean;
  boletoGerado?: boolean;
  nfGerada?: boolean;
}

export interface DocumentosStatus {
  a4: boolean;
  boleto: boolean;
  nf: boolean;
}
