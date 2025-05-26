
import { Cliente, Pedido, StatusAgendamentoCliente } from "@/types";

export interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: "Agendar" | "Previsto" | "Agendado";
  isPedidoUnico: boolean;
}
