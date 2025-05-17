
export type StatusCliente = 'Ativo' | 'Em análise' | 'Inativo' | 'A ativar' | 'Standby';

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
}

export type StatusPedido = 'Agendado' | 'Em Separação' | 'Despachado' | 'Entregue' | 'Cancelado';

export interface ItemPedido {
  id: number;
  idPedido: number;
  idSabor: number;
  nomeSabor: string;
  quantidadeSabor: number;
  quantidadeSeparada?: number;
  quantidadeEntregue?: number;
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
}

export interface ComponenteProduto {
  id: number;
  idProduto: number;
  idReceita: number;
  nomeReceita: string;
  quantidade: number;
  custoParcial: number;
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
