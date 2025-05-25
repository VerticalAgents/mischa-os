export type StatusCliente = "Ativo" | "Inativo" | "A ativar" | "Em análise" | "Standby";
export type DiaSemana = "Seg" | "Ter" | "Qua" | "Qui" | "Sex" | "Sab" | "Dom";
export type TipoLogisticaNome = "Própria" | "Distribuição";
export type TipoCobranca = "À vista" | "Consignado";
export type FormaPagamentoNome = "Boleto" | "PIX" | "Dinheiro";
export type TipoComponente = "Receita" | "Insumo";

export interface Cliente {
  id: number;
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  statusCliente: StatusCliente;
  dataCadastro: Date;
  metaGiroSemanal?: number;
  ultimaDataReposicaoEfetiva?: Date;
  proximaDataReposicao?: Date;
  statusAgendamento?: string;
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
  ativo: boolean;
  giroMedioSemanal: number;
  categoriasProdutos?: number[]; // New field for product categories
}

export interface Pedido {
  id: number;
  cliente?: Cliente;
  itensPedido: ItemPedido[];
  dataCriacao: Date;
  dataPrevistaEntrega: string;
  dataEfetivaEntrega?: string;
  totalPedidoUnidades: number;
  observacoes?: string;
  statusPedido: string;
  tipoPedido: string;
}

export interface ItemPedido {
  id: number;
  idPedido: number;
  idSabor: number;
  nomeSabor: string;
  quantidadeSabor: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  precoVenda: number;
  custoTotal: number;
  margemLucro: number;
  componentes: ComponenteProduto[];
  ativo: boolean;
	pesoUnitario: number;
	custoUnitario: number;
  unidadesProducao?: number;
  categoria: string;
  estoqueMinimo: number;
  categoriaId: number;
  subcategoriaId: number;
}

export interface ComponenteProduto {
  id: number;
  idProduto: number;
  idReceita: number;
  nomeReceita: string;
  quantidade: number;
  custoParcial: number;
  tipo: TipoComponente;
  idItem: number;
  nome: string;
  custo: number;
}

export interface Insumo {
  id: number;
  nome: string;
  descricao?: string;
  unidadeMedida: string;
  precoCusto: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  dataUltimaCompra?: Date;
  fornecedor?: string;
  observacoes?: string;
}

export interface Receita {
  id: number;
  nome: string;
  descricao?: string;
  ingredientes: IngredienteReceita[];
  custoTotal: number;
  rendimento: number;
  unidadeMedidaRendimento: string;
  observacoes?: string;
}

export interface IngredienteReceita {
  id: number;
  idReceita: number;
  idInsumo: number;
  nomeInsumo: string;
  quantidade: number;
  unidadeMedida: string;
  custoParcial: number;
}

export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string;
  subcategorias: ProdutoSubcategoria[];
  quantidadeProdutos: number;
}

export interface ProdutoSubcategoria {
  id: number;
  nome: string;
  categoriaId: number;
  quantidadeProdutos: number;
}
