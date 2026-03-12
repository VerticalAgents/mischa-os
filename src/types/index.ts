export type StatusCliente = 'Ativo' | 'Em análise' | 'Inativo' | 'A ativar' | 'Standby';

// Tipo de pessoa para clientes
export type TipoPessoa = 'PF' | 'PJ';

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

// Status de agendamento do cliente - updated to include Separado
export type StatusAgendamentoCliente = 'Agendar' | 'Previsto' | 'Agendado' | 'Separado' | 'Reagendar' | string;

export interface Cliente {
  id: string; // UUID from Supabase
  nome: string;
  tipoPessoa?: TipoPessoa; // PF (Pessoa Física) ou PJ (Pessoa Jurídica)
  cnpjCpf?: string;
  inscricaoEstadual?: string; // Apenas para PJ
  enderecoEntrega?: string;
  linkGoogleMaps?: string; // New field for Google Maps link
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
  ativo: boolean;
  giroMedioSemanal?: number;
  
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
  prazoPagamentoDias?: number; // Prazo de pagamento para boleto (7, 14 ou 21 dias)
  observacoes?: string;
  
  // Added missing category fields
  categoriaId: number;
  subcategoriaId: number;
  
  // New field for category selection
  categoriasHabilitadas?: number[]; // Array of category IDs that client can purchase
  
  // ID externo para integração com GestãoClick
  gestaoClickClienteId?: string;
  
  // Flag para desabilitar reagendamento automático
  desabilitarReagendamento?: boolean;
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
export type TipoPedidoAgendamento = 'Padrão' | 'Alterado'; // Specific type for agendamento context
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
  idPedido: string | number; // Aceita tanto string (UUID) quanto number para compatibilidade
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
  id: string | number; // Aceita tanto string (UUID) quanto number para compatibilidade
  idCliente: string; // Changed to string to match Cliente.id (UUID)
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
  margemLucro: number;
  componentes: ComponenteProduto[];
  ativo: boolean;
  unidadesProducao: number;
  pesoUnitario: number;
  custoUnitario: number;
  categoria: string;
  estoqueMinimo: number;
  estoque_atual?: number;
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

// Updated HistoricoProducao interface to use string for produtoId (UUID)
export interface HistoricoProducao {
  id: number;
  dataProducao: Date;
  produtoId: string; // Changed from number to string to match Supabase UUID
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
    idCliente: string; // Changed from number to string
    nomeCliente: string;
    giroSemanal: number;
  }[];
  giroMedioSemanalGeral: number;
  previsaoGiroTotalSemanal: number;
  previsaoGiroTotalMensal: number;
}
