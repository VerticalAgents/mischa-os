
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import AgendamentoActions from "./AgendamentoActions";
import { Cliente } from "@/hooks/useClientesSupabase";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: any;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface AgendamentoRowProps {
  agendamento: AgendamentoItem;
  index: number;
  onEdit: (agendamento: AgendamentoItem) => void;
}

export default function AgendamentoRow({ agendamento, index, onEdit }: AgendamentoRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Previsto": return "bg-amber-500";
      case "Agendado": return "bg-green-500";
      case "Reagendar": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getTipoPedidoColor = (tipoPedido?: string) => {
    switch (tipoPedido) {
      case "Padrão": return "bg-green-100 text-green-800";
      case "Alterado": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <TableRow 
      key={`${agendamento.cliente.id}-${index}`}
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onEdit(agendamento)}
    >
      <TableCell className="font-medium">
        <div>
          <div>{agendamento.cliente.nome}</div>
          {!agendamento.isPedidoUnico && agendamento.cliente.contato_nome && (
            <div className="text-xs text-muted-foreground">
              {agendamento.cliente.contato_nome}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {format(agendamento.dataReposicao, 'dd/MM/yyyy')}
      </TableCell>
      <TableCell>
        <Badge className={`${getStatusColor(agendamento.statusAgendamento)} text-white`}>
          {agendamento.statusAgendamento}
        </Badge>
      </TableCell>
      <TableCell>
        {agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidade_padrao || 0} un
      </TableCell>
      <TableCell>
        <Badge variant={agendamento.isPedidoUnico ? "destructive" : "default"}>
          {agendamento.isPedidoUnico ? "Pedido Único" : "PDV"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={getTipoPedidoColor(agendamento.pedido?.tipoPedido)}>
          {agendamento.pedido?.tipoPedido || "Padrão"}
        </Badge>
      </TableCell>
      <TableCell>
        <AgendamentoActions agendamento={agendamento} />
      </TableCell>
    </TableRow>
  );
}
