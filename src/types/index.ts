
export type StatusCliente = 'Ativo' | 'Em análise' | 'Inativo' | 'A ativar' | 'Standby';

// Adding new types for client configuration
export type DiaSemana = 'Dom' | 'Seg' | 'Ter' | 'Qua' | 'Qui' | 'Sex' | 'Sáb';
export type TipoLogistica = 'Própria' | 'Distribuição';
export type TipoCobranca = 'À vista' | 'Consignado';
export type FormaPagamento = 'Boleto' | 'PIX' | 'Dinheiro';

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
  
  // Novos campos para configuração avançada
  janelasEntrega?: DiaSemana[];
  representanteId?: number;
  rotaEntregaId?: number;
  categoriaEstabelecimentoId?: number;
  instrucoesEntrega?: string;
  contabilizarGiroMedio: boolean;
  tipoLogistica: TipoLogistica;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamento;
  observacoes?: string;
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

export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';
export type TipoPedido = 'Padrão' | 'Alterado' | 'Único';

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
  itensPedido: ItemPedido[];
  observacoes?: string;
  totalPedidoUnidades: number;
  valorTotal?: number;
  separado?: boolean;
  tipoPedido?: TipoPedido;
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
