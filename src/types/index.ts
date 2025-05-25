export type StatusCliente = 'Ativo' | 'Em análise' | 'Inativo' | 'A ativar' | 'Standby';

// Adding new types for client configuration
export type DiaSemana = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';

// Updated interfaces for configuration
export interface TipoLogistica {
  id: number;
  nome: string;
  percentualLogistico: number; // em porcentagem
  ativo: boolean;
}

export interface FormaPagamento {
  id: number;
  nome: string;
  ativo: boolean;
}

export type TipoLogisticaNome = 'Própria' | 'Distribuição';
export type TipoCobranca = 'À vista' | 'Consignado';
export type FormaPagamentoNome = 'Boleto' | 'PIX' | 'Dinheiro';

// Status de agendamento do cliente
export type StatusAgendamentoCliente = 'Agendar' | 'Previsto' | 'Agendado' | 'Reagendar' | string;

export interface Cliente {
  id: number;
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number;
  periodicidadePadrao: number; // em dias
  statusCliente: StatusCliente;
  dataCadastro: Date;
  metaGiroSemanal?: number; // Meta de giro semanal
  ultimaDataReposicaoEfetiva?: Date; // Data da última reposição efetiva
  statusAgendamento?: StatusAgendamentoCliente; // Status do agendamento
  proximaDataReposicao?: Date; // Próxima data de reposição agendada
  ativo: boolean; // Added missing property
  giroMedioSemanal?: number; // Added missing property
  
  // Novos campos para configuração avançada
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
  
  // New field for category selection
  categoriasHabilitadas?: number[]; // Array of category IDs that client can purchase
}

// Representantes, Rotas e Categorias para configuração
export interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
}

export interface RotaEntrega {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

export interface ConfiguracoesProducao {
  unidadesPorForma: number;
  formasPorLote: number;
  incluirPedidosPrevistos: boolean;
  percentualPedidosPrevistos: number;
  tempoMedioPorFornada: number; // em minutos
  unidadesBrowniePorForma: number;
  formasPorFornada: number;
}

export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';
export type TipoPedido = 'Padrão' | 'Alterado' | 'Único';
export type SubstatusPedidoAgendado = 'Agendado' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';

export interface AlteracaoStatusPedido {
  dataAlteracao: Date;
  usuarioId?: number;
  nomeUsuario?: string;
  statusAnterior: StatusPedido;
  statusNovo: StatusPedido;
  substatusAnterior?: SubstatusPedidoAgendado;
  substatusNovo?: SubstatusPedidoAgendado;
  observacao?: string;
}

export interface ItemPedido {
  id: number;
  idPedido: number;
  idSabor: number;
  nomeSabor?: string; // Make nomeSabor optional to match mockData
  quantidadeSabor: number;
  quantidadeSeparada?: number;
  quantidadeEntregue?: number;
  sabor?: {
    nome: string;
  };
}

export interface Pedido {
  id: number;
  idCliente: number;
  cliente?: Cliente;
  dataPedido: Date;
  dataPrevistaEntrega: Date;
  dataEfetivaEntrega?: Date;
  statusPedido: StatusPedido;
  substatusPedido?: SubstatusPedidoAgendado;
  itensPedido: ItemPedido[];
  observacoes?: string;
  totalPedidoUnidades: number;
  valorTotal?: number;
  separado?: boolean;
  tipoPedido?: TipoPedido;
  historicoAlteracoesStatus?: AlteracaoStatusPedido[];
}

export type CategoriaInsumo = 'Matéria Prima' | 'Embalagem' | 'Outros';
export type UnidadeMedida = 'g' | 'kg' | 'ml' | 'l' | 'un' | 'pct';

export interface Insumo {
  id: number;
  nome: string;
  categoria: CategoriaInsumo;
  volumeBruto: number;
  unidadeMedida: UnidadeMedida;
  custoMedio: number;
  custoUnitario: number;
}

export interface ItemReceita {
  id: number;
  idReceita: number;
  idInsumo: number;
  nomeInsumo: string;
  quantidade: number;
  unidadeMedida: UnidadeMedida;
  custoParcial: number;
  custo?: number;
  insumo?: Insumo;
}

export interface ReceitaBase {
  id: number;
  nome: string;
  descricao?: string;
  rendimento: number;
  unidadeRendimento: string;
  itensReceita: ItemReceita[];
  custoTotal: number;
  custoUnitario: number;
  pesoTotal?: number;
}

export type TipoComponente = 'Receita' | 'Insumo';

export interface ComponenteProduto {
  id: number;
  idProduto: number;
  idReceita: number;
  nomeReceita: string;
  quantidade: number;
  custoParcial: number;
  tipo?: TipoComponente;
  idItem?: number;
  nome?: string;
  custo?: number;
}

// Product category types
export interface ProdutoSubcategoria {
  id: number;
  nome: string;
  categoriaId: number;
  quantidadeProdutos: number;
}

export interface ProdutoCategoria {
  id: number;
  nome: string;
  descricao?: string;
  subcategorias: ProdutoSubcategoria[];
  quantidadeProdutos: number;
}

// Update Produto interface to include category and subcategory
export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  precoVenda: number;
  custoTotal: number;
  margemLucro: number; // em porcentagem
  componentes: ComponenteProduto[];
  ativo: boolean;
  pesoUnitario?: number;
  custoUnitario?: number;
  unidadesProducao?: number;
  categoria?: string; // Added category field
  estoqueMinimo?: number; // Added estoqueMinimo field
  categoriaId: number;
  subcategoriaId: number;
}

export interface Sabor {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  custoUnitario: number;
  precoVenda: number;
  estoqueMinimo: number;
  estoqueIdeal: number;
  saldoAtual: number;
  emProducao: number;
  idReceitaBase?: number;
  nomeReceitaBase?: string;
  percentualPadraoDist?: number;
}

export interface PlanejamentoProducao {
  id: number;
  dataPlanejamento: Date;
  dataProducao: Date;
  status: 'Pendente' | 'Em Produção' | 'Concluído' | 'Cancelado';
  itensPlanejamento: {
    idSabor: number;
    nomeSabor: string;
    quantidadePlanejada: number;
    quantidadeProduzida?: number;
  }[];
  observacoes?: string;
  totalUnidades: number;
  // Additional properties needed for usePlanejamentoProducaoStore
  totalUnidadesAgendadas?: number;
  formasNecessarias?: number;
}

// Add new type for production history
export interface HistoricoProducao {
  id: number;
  dataProducao: Date;
  produtoId: number;
  produtoNome: string;
  formasProducidas: number;
  unidadesCalculadas: number;
  turno: string;
  observacoes?: string;
  origem: 'Agendada' | 'Manual'; // Track where the production came from
}

export type TipoAlerta = 
  | 'EstoqueAbaixoMinimo' 
  | 'ProximasEntregas' 
  | 'DeltaForaTolerancia' 
  | 'PedidoAgendado' 
  | 'PedidoPronto';

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  mensagem: string;
  dataAlerta: Date;
  lida: boolean;
  dados: Record<string, any>;
}

export interface DashboardData {
  contadoresStatus: {
    ativos: number;
    emAnalise: number;
    inativos: number;
    aAtivar: number;
    standby: number;
  };
  giroMedioSemanalPorPDV: {
    idCliente: number;
    nomeCliente: string;
    giroSemanal: number;
  }[];
  giroMedioSemanalGeral: number;
  previsaoGiroTotalSemanal: number;
  previsaoGiroTotalMensal: number;
}
