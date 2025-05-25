
import { Cliente, Pedido } from "@/types";

export interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}
