
import { Cliente } from './cliente';

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
