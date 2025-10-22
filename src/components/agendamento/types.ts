
import { Cliente, Pedido, StatusAgendamentoCliente } from "@/types";

export interface AgendamentoItem {
  id?: string;
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: "Agendar" | "Previsto" | "Agendado";
  substatus_pedido?: string;
  isPedidoUnico: boolean;
}
