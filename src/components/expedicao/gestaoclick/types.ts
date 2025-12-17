export interface ItemVendaGC {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria_id?: number;
}

export interface VendaGC {
  id: string; // agendamento_id
  gestaoclick_venda_id: string;
  gestaoclick_sincronizado_em: string;
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
