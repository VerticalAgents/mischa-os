
import { Cliente, Pedido, StatusAgendamentoCliente } from "@/types";

export interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido & { contatar_cliente?: boolean };
  dataReposicao: Date;
  statusAgendamento: "Agendar" | "Previsto" | "Agendado";
  substatus_pedido?: string;
  isPedidoUnico: boolean;
  contatar_cliente?: boolean;
}
