
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
  descricao: string;
  percentualLogistico: number;
  ativo: boolean;
};

export type FormaPagamento = {
  id: number;
  nome: string;
  descricao?: string; // Made optional to fix FormasPagamentoList issues
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
}

// Pedido types
export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';
export type SubstatusPedidoAgendado = 'Agendado' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';

export interface Pedido {
  id: number;
  clienteId: number;
  dataPedido: Date;
  dataEntrega: Date;
  status: StatusPedido;
  substatus?: SubstatusPedidoAgendado;
  itens: PedidoItem[];
  valorTotal: number;
  observacoes?: string;
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
}

// Dashboard analytics types
export type Channel = 'Delivery' | 'B2B' | 'Eventos' | 'Varejo';

export interface DREData {
  totalRevenue: number;
  channelsData: {
    channel: Channel;
    revenue: number;
    percentage: number;
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
  ProjectionData
} from './projections';
