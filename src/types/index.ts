
// Cliente (PDV) model
export interface Cliente {
  id: number;
  nome: string;
  cnpjCpf?: string;
  enderecoEntrega?: string;
  contatoNome?: string;
  contatoTelefone?: string;
  contatoEmail?: string;
  quantidadePadrao: number; // Qp
  periodicidadePadrao: number; // Pp em dias
  statusCliente: StatusCliente;
  dataCadastro: Date;
  ultimaDataReposicaoEfetiva?: Date;
  observacoes?: string;
}

export type StatusCliente = "Ativo" | "Em análise" | "Inativo" | "A ativar" | "Standby";

// Sabor model
export interface Sabor {
  id: number;
  nome: string;
  percentualPadraoDist: number; // 0-100
  ativo: boolean;
  estoqueMinimo: number;
  saldoAtual: number;
}

// Pedido model
export interface Pedido {
  id: number;
  idCliente: number;
  cliente?: Cliente; // Para relações
  dataPedido: Date;
  dataPrevistaEntrega: Date;
  totalPedidoUnidades: number;
  tipoPedido: "Padrão" | "Alterado";
  statusPedido: StatusPedido;
  dataEfetivaEntrega?: Date;
  observacoes?: string;
  itensPedido: ItemPedido[];
}

export type StatusPedido = "Agendado" | "Em Separação" | "Despachado" | "Entregue" | "Cancelado";

// Item do Pedido model
export interface ItemPedido {
  id: number;
  idPedido: number;
  idSabor: number;
  sabor?: Sabor; // Para relações
  quantidadeSabor: number;
  quantidadeEntregue?: number;
}

// Dados para o dashboard
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

// Alerta model
export interface Alerta {
  id: number;
  tipo: "DeltaForaTolerancia" | "EstoqueAbaixoMinimo" | "ProximasEntregas";
  mensagem: string;
  dataAlerta: Date;
  lida: boolean;
  dados: any; // Dados específicos do alerta
}

// Planejamento de produção
export interface PlanejamentoProducao {
  idSabor: number;
  nomeSabor: string;
  totalUnidadesAgendadas: number;
  formasNecessarias: number;
}
