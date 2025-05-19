export type Representante = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
  comissao?: number; // Added missing property
};

export type RotaEntrega = {
  id: number;
  nome: string;
  descricao: string;
  ativo: boolean;
  diasSemana?: string[]; // Added missing property
  horarioInicio?: string; // Added for config data
  horarioFim?: string; // Added for config data
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
  descricao?: string;  // Optional to match usage in TiposLogisticaList
  percentualLogistico: number; // Added missing property
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
  margemLucroPadrao?: number; // Added for configData.ts
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
  observacoes?: string; // Added for ClienteFormDialog
  ultimaDataReposicaoEfetiva?: Date; // Added missing property
}

// Pedido types
export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';
export type SubstatusPedidoAgendado = 'Agendado' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';
export type TipoPedido = 'Padrão' | 'Alterado'; // Added type for tipoPedido

export interface PedidoItem {
  id: number;
  produtoId: number;
  quantidade: number;
  valorUnitario: number;
}

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
  itensPedido?: ItemPedido[]; // Added for legacy references
  valorTotal: number;
  observacoes?: string;
  totalPedidoUnidades?: number; // Added to match references
  idCliente?: number; // Added to support legacy usage
  tipoPedido?: TipoPedido; // Added for SeparacaoPedidos.tsx
  historicoAlteracoesStatus?: AlteracaoStatusPedido[];
}

// Add missing ItemPedido and AlteracaoStatusPedido types 
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
  descricao?: string; // Made optional to match usage in components
  ativo: boolean;
  subcategorias: ProdutoSubcategoria[];
  quantidadeProdutos?: number; // Added for categoria store
}

export interface ProdutoSubcategoria {
  id: number;
  categoriaId: number;
  nome: string;
  ativo: boolean;
  quantidadeProdutos?: number; // Added for categoria store
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
}

export interface Produto {
  id: number;
  nome: string;
  categoriaId: number;
  subcategoriaId: number;
  componentes: ComponenteProduto[];
  ativo: boolean;
}

export interface ComponenteProduto {
  id: number;
  nome: string;
  tipo: TipoComponente;
  quantidade: number;
}

export type TipoComponente = 'Insumo' | 'Outro';

export interface ReceitaBase {
  id: number;
  nome: string;
  rendimento: number;
  itens: ItemReceita[];
}

export interface ItemReceita {
  id: number;
  insumoId: number;
  quantidade: number;
}

export interface Alerta {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  data: Date;
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
  Channel,  // Make sure to export Channel directly
  CostItem,
  InvestmentItem  
} from './projections';
