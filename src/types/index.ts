
export type StatusCliente = 'Ativo' | 'Inativo' | 'Em análise' | 'A ativar' | 'Standby';

export type StatusAgendamentoCliente = 'Agendado' | 'Não Agendado' | 'Confirmado' | 'Agendar' | 'Previsto';

export type TipoPedidoAgendamento = 'Padrão' | 'Alterado' | 'Único';

export type TipoLogisticaNome = 'Própria' | 'Terceirizada';

export type TipoCobranca = 'À vista' | 'Faturado';

export type FormaPagamentoNome = 'Boleto' | 'Cartão' | 'Dinheiro' | 'PIX';

export type SubstatusPedidoAgendado = 'Agendado' | 'Confirmado' | 'Produzindo' | 'Pronto' | 'Separado' | 'Despachado' | 'Entregue' | 'Retorno';

export type DiaSemana = 'Domingo' | 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';

export type ProdutoCategoria = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  subcategorias?: ProdutoSubcategoria[];
  quantidadeProdutos?: number;
};

export type ProdutoSubcategoria = {
  id: number;
  nome: string;
  descricao?: string;
  categoria_id: number;
  ativo: boolean;
};

export type Representante = {
  id: number;
  nome: string;
  ativo: boolean;
};

export type RotaEntrega = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
};

export type CategoriaEstabelecimento = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
};

export type TipoLogistica = {
  id: number;
  nome: TipoLogisticaNome;
  ativo: boolean;
};

export type FormaPagamento = {
  id: number;
  nome: FormaPagamentoNome;
  ativo: boolean;
};

export type ConfiguracoesProducao = {
  tempoProducaoPadrao: number;
  capacidadeMaximaDiaria: number;
  margemSegurancaEstoque: number;
  unidadesPorForma: number;
  formasPorLote: number;
  formasPorFornada: number;
};

export type Sabor = {
  id: string;
  nome: string;
  ativo: boolean;
  categoria?: string;
  saldoAtual?: number;
  percentualPadraoDist?: number;
};

export type Alerta = {
  id: string;
  tipo: 'erro' | 'aviso' | 'info';
  titulo: string;
  mensagem: string;
  timestamp: Date;
  resolvido: boolean;
  lida?: boolean;
};

export type CategoriaInsumo = {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
};

export type UnidadeMedida = {
  id: number;
  nome: string;
  abreviacao: string;
  ativo: boolean;
};

export type Insumo = {
  id: string;
  nome: string;
  categoriaId: number;
  categoria?: string;
  unidadeMedida: string;
  custoUnitario: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  ativo: boolean;
  volumeBruto?: number;
  custoMedio?: number;
};

export type DashboardData = {
  vendas: number;
  pedidos: number;
  clientes: number;
  producao: number;
};

export interface Cliente {
  id: string;
  nome: string;
  cnpjCpf: string;
  enderecoEntrega: string;
  contatoNome: string;
  contatoTelefone: string;
  contatoEmail: string;
  quantidadePadrao: number;
  periodicidadePadrao: number;
  statusCliente: StatusCliente;
  metaGiroSemanal: number;
  categoriaEstabelecimentoId: number | null;
  janelasEntrega: string[];
  instrucoesEntrega: string;
  tipoLogistica: TipoLogisticaNome;
  contabilizarGiroMedio: boolean;
  emiteNotaFiscal: boolean;
  tipoCobranca: TipoCobranca;
  formaPagamento: FormaPagamentoNome;
  observacoes: string;
  categoriasHabilitadas: number[];
  ativo: boolean;
  giroMedioSemanal: number;
  ultimaDataReposicaoEfetiva?: Date;
  statusAgendamento: StatusAgendamentoCliente;
  proximaDataReposicao?: Date;
  dataCadastro: Date;
  categoriaId: number;
  subcategoriaId: number;
  representanteId?: number;
  rotaEntregaId?: number;
}

export type StatusPedido = 'Pendente' | 'Confirmado' | 'Em Produção' | 'Pronto' | 'Em Trânsito' | 'Entregue' | 'Cancelado' | 'Finalizado' | 'Agendado' | 'Em Separação' | 'Despachado';

export interface ItemPedido {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  preco: number;
  subtotal: number;
  idPedido?: string;
  nomeSabor?: string;
  idSabor?: string;
  quantidadeSabor?: number;
  sabor?: {
    nome: string;
  };
}

export interface Pedido {
  id: string;
  idCliente: string;
  clienteId: string;
  cliente?: Cliente;
  dataPedido: Date;
  dataPrevistaEntrega: Date;
  status: StatusPedido;
  statusPedido: StatusPedido;
  valorTotal: number;
  observacoes: string;
  itensPedido: ItemPedido[];
  itens: ItemPedido[];
  dataEntrega?: Date;
  dataEfetivaEntrega?: Date;
  enderecoEntrega: string;
  contatoEntrega: string;
  numeroPedidoCliente: string;
  totalPedidoUnidades: number;
  createdAt: Date;
  updatedAt?: Date;
  tipoPedido?: TipoPedidoAgendamento;
}

export interface JanelaEntrega {
  diaSemana: DiaSemana;
  horarioInicio: string;
  horarioFim: string;
}

export interface ProducaoSimuladaItem {
  idSabor: string;
  nomeSabor: string;
  formasPrevistas: number;
  unidadesPrevistas: number;
  sobraEstimada: number;
}

export interface FlavorPlan {
  idSabor: string;
  nomeSabor: string;
  totalUnidadesAgendadas: number;
  formasNecessarias: number;
  estoqueAtual: number;
  saldo: number;
  status: string;
}
