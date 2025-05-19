
export type UnidadeMedida = "g" | "kg" | "ml" | "l" | "un" | "pct";

export type CategoriaInsumo = "Matéria Prima" | "Embalagem" | "Outros";

export type Insumo = {
  id: number;
  nome: string;
  categoria: CategoriaInsumo;
  volumeBruto: number;
  unidadeMedida: UnidadeMedida;
  custoMedio: number;
  custoUnitario: number;
  estoqueAtual?: number;
  estoqueMinimo?: number;
  ultimaEntrada?: Date;
};

export type Fornecedor = {
  id: number;
  nome: string;
  contato?: string;
  email?: string;
  telefone?: string;
};

export type ItemCotacao = {
  id: number;
  insumoId: number;
  quantidade: number;
};

export type PropostaFornecedor = {
  id: number;
  cotacaoId: number;
  fornecedorId: number;
  itens: {
    itemId: number;
    precoUnitario: number;
  }[];
  prazoEntrega: number; // em dias
  frete: number;
  formaPagamento: string;
  observacoes?: string;
};

export type Cotacao = {
  id: number;
  titulo: string;
  dataCriacao: Date;
  dataValidade?: Date;
  status: "Aberta" | "Aguardando Propostas" | "Finalizada" | "Cancelada";
  itens: ItemCotacao[];
  propostas: PropostaFornecedor[];
  propostaVencedoraId?: number;
};

export type PedidoCompra = {
  id: number;
  cotacaoId?: number;
  fornecedorId: number;
  dataCriacao: Date;
  dataEntregaPrevista: Date;
  itens: {
    insumoId: number;
    quantidade: number;
    precoUnitario: number;
  }[];
  valorTotal: number;
  status: "Pendente" | "Enviado" | "Recebido" | "Cancelado";
  observacoes?: string;
};

export type MovimentacaoEstoque = {
  id: number;
  insumoId: number;
  tipo: "entrada" | "saida";
  quantidade: number;
  data: Date;
  usuario: string;
  observacao?: string;
  pedidoCompraId?: number;
};
