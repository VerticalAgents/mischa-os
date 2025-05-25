
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AgendamentoItem } from "./types";
import { Edit } from "lucide-react";

interface AgendamentoTableProps {
  agendamentos: AgendamentoItem[];
  onEditarAgendamento: (agendamento: AgendamentoItem) => void;
}

export default function AgendamentoTable({ agendamentos, onEditarAgendamento }: AgendamentoTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Previsto":
        return "outline";
      case "Agendado":
        return "default";
      case "Reagendar":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Quantidade</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agendamentos.map((agendamento, index) => (
            <TableRow key={`${agendamento.cliente.id}-${index}`}>
              <TableCell className="font-medium">
                {agendamento.cliente.nome}
              </TableCell>
              <TableCell>
                {formatDate(agendamento.dataReposicao)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(agendamento.statusAgendamento)}>
                  {agendamento.statusAgendamento}
                </Badge>
              </TableCell>
              <TableCell>
                {agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao}
              </TableCell>
              <TableCell>
                <Badge variant={agendamento.isPedidoUnico ? "secondary" : "outline"}>
                  {agendamento.isPedidoUnico ? "Único" : "Padrão"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditarAgendamento(agendamento)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
