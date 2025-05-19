
export type Representante = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
};

export type RotaEntrega = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
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
  descricao: string;  // Make it optional to match usage in TiposLogisticaList
  percentualLogistico: number;
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
  observacoes?: string; // Added to match ClienteFormDialog
}

// Pedido types
export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';
export type SubstatusPedidoAgendado = 'Agendado' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';

export interface Pedido {
  id: number;
  clienteId: number;
  cliente?: Cliente; // Added to match references in components
  dataPedido: Date;
  dataEntrega: Date;
  dataPrevistaEntrega?: Date; // Added to match references
  dataEfetivaEntrega?: Date; // Added to match references
  status: StatusPedido;
  statusPedido?: StatusPedido; // Added to match legacy references
  substatus?: SubstatusPedidoAgendado;
  substatusPedido?: SubstatusPedidoAgendado; // Added to match legacy references
  itens: PedidoItem[];
  valorTotal: number;
  observacoes?: string;
  totalPedidoUnidades?: number; // Added to match references
  idCliente?: number; // Added to support legacy usage
}

export interface PedidoItem {
  id: number;
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

// Produto categories
export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string; // Made optional to match usage in components
  ativo: boolean;
  subcategorias: ProdutoSubcategoria[];
}

export interface ProdutoSubcategoria {
  id: number;
  categoriaId: number;
  nome: string;
  ativo: boolean;
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
  DREData, // Export DREData so it can be imported from @/types
  Channel  // Export Channel so it can be imported from @/types
} from './projections';

