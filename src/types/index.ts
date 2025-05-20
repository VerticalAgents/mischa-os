
export type Representante = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  comissao?: number; // Added property
};

export type RotaEntrega = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  diasSemana?: string[]; // Added property
  horarioInicio?: string;
  horarioFim?: string;
};

export type CategoriaEstabelecimento = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
};

export type TipoLogistica = {
  id: number;
  nome: string;
  descricao?: string;
  percentualLogistico: number; // Required property
  ativo: boolean;
};

export type FormaPagamento = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
};

export type ConfiguracoesProducao = {
  tempoPreparoPadrao: number;
  custoHoraProducao: number;
  margemLucroDesejada: number;
  margemLucroPadrao?: number; // Added property
  incluirPedidosPrevistos?: boolean;
  formasPorLote?: number;
  unidadesPorForma?: number;
  percentualPedidosPrevistos?: number;
  tempoMedioPorFornada?: number;
  unidadesBrowniePorForma?: number;
  formasPorFornada?: number;
};

export type CategoriaInsumoParam = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  quantidadeItensVinculados?: number;
};

// Cliente types
export type StatusCliente = 'Ativo' | 'Em análise' | 'Inativo' | 'A ativar' | 'Standby';
export type TipoLogisticaNome = 'Própria' | 'Distribuição';
export type TipoCobranca = 'À vista' | 'Consignado';
export type FormaPagamentoNome = 'Boleto' | 'PIX' | 'Dinheiro';
export type DiaSemana = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';

export interface Cliente {
  id: number;
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  statusCliente: StatusCliente;
  dataCadastro: Date;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  representanteId?: number;
  categoriaEstabelecimentoId?: number;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  contabilizarGiroMedio: boolean;
  janelasEntrega?: DiaSemana[];
  rotaEntregaId?: number;
  tipoLogistica: TipoLogisticaNome;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  instrucoesEntrega?: string;
  statusAgendamento?: string;
  proximaDataReposicao?: Date;
  metaGiroSemanal?: number;
  observacoes?: string;
  ultimaDataReposicaoEfetiva?: Date; // Added property
};

// Pedido types
export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';
export type SubstatusPedidoAgendado = 'Agendado' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';
export type TipoPedido = 'Padrão' | 'Alterado';

export interface PedidoItem {
  id: number;
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

export interface Pedido {
  id: number;
  clienteId: number;
  cliente?: Cliente;
  dataPedido: Date;
  dataEntrega: Date;
  dataPrevistaEntrega?: Date;
  dataEfetivaEntrega?: Date;
  status: StatusPedido;
  statusPedido?: StatusPedido;
  substatus?: SubstatusPedidoAgendado;
  substatusPedido?: SubstatusPedidoAgendado;
  itens: PedidoItem[];
  itensPedido?: ItemPedido[];
  valorTotal: number;
  observacoes?: string;
  totalPedidoUnidades?: number;
  idCliente?: number;
  tipoPedido?: TipoPedido;
  historicoAlteracoesStatus?: AlteracaoStatusPedido[];
}

// Updated ItemPedido and AlteracaoStatusPedido types
export interface ItemPedido {
  id: number;
  idPedido: number;
  idSabor: number;
  nomeSabor?: string;
  sabor?: { nome: string };
  quantidadeSabor: number;
  quantidadeEntregue?: number;
}

export interface AlteracaoStatusPedido {
  dataAlteracao: Date;
  statusAnterior: StatusPedido;
  statusNovo: StatusPedido;
  substatusAnterior?: SubstatusPedidoAgendado;
  substatusNovo?: SubstatusPedidoAgendado;
  observacao?: string;
}

// Produto categories
export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  subcategorias: ProdutoSubcategoria[];
  quantidadeProdutos?: number; // Added property
}

export interface ProdutoSubcategoria {
  id: number;
  categoriaId: number;
  nome: string;
  ativo: boolean;
  quantidadeProdutos?: number; // Added property
}

// Dashboard data
export interface DashboardData {
  vendasMensais: number;
  clientesAtivos: number;
  ticketMedio: number;
  taxaCrescimento: number;
  pedidosPendentes: number;
  contadoresStatus: {
    ativos: number;
    emAnalise: number;
    aAtivar: number;
    standby: number;
    inativos: number;
  };
  giroMedioSemanalPorPDV: {
    nomeCliente: string;
    giroSemanal: number;
  }[];
  giroMedioSemanalGeral?: number;
  previsaoGiroTotalSemanal?: number;
  previsaoGiroTotalMensal?: number;
}

// Add missing types for Sabor, Produto, etc.
export interface Sabor {
  id: number;
  nome: string;
  ativo: boolean;
  saldoAtual?: number;
  percentualPadraoDist?: number; // Added property
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string; // Added property
  categoriaId: number;
  subcategoriaId: number;
  componentes: ComponenteProduto[];
  ativo: boolean;
  categoria?: string; // Added property
  custoUnitario?: number; // Added property
  custoTotal?: number; // Added property
  pesoUnitario?: number; // Added property
  unidadesProducao?: number; // Added property
  estoqueMinimo?: number; // Added property
  precoVenda?: number; // Added property for compatibility
  margemLucro?: number; // Added property for compatibility
}

export interface ComponenteProduto {
  id: number;
  nome: string;
  tipo: TipoComponente;
  quantidade: number;
  idItem?: number; // Added property
  custo?: number; // Added property
}

export type TipoComponente = 'Insumo' | 'Outro' | 'Receita';

export interface ReceitaBase {
  id: number;
  nome: string;
  rendimento?: number;
  itens: ItemReceita[];
  pesoTotal?: number; // Added property
  custoTotal?: number; // Added property
  itensReceita?: ItemReceita[]; // Added property for compatibility
}

export interface ItemReceita {
  id: number;
  insumoId: number;
  idInsumo?: number; // Added for compatibility
  quantidade: number;
  custo?: number; // Added property
  insumo?: { nome: string; unidadeMedida?: string }; // Added property
}

export interface Alerta {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: Date;
  dataAlerta: Date; // Added property
  lido: boolean;
  link?: string;
}

// Add types from insumos.ts - to fix import errors
export type { 
  UnidadeMedida,
  CategoriaInsumo,
  Insumo,
  Fornecedor,
  ItemCotacao,
  PropostaFornecedor,
  Cotacao,
  PedidoCompra,
  MovimentacaoEstoque
} from './insumos';

// Add types from giro.ts - to fix any other import errors
export type { AnaliseGiroData } from './giro';

// Add types from projections.ts - to fix any other import errors
export type { 
  ProjectionParams,
  ProjectionScenario, 
  ProjectionData,
  DREData,
  Channel,
  CostItem,
  InvestmentItem  
} from './projections';
