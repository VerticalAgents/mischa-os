
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AgendamentoItem } from "./types";
import { Edit, Plus, Check, ChevronUp, ChevronDown } from "lucide-react";

interface AgendamentoTableProps {
  agendamentos: AgendamentoItem[];
  onCriarPedido: (clienteId: string) => void;
  onEditarAgendamento: (agendamento: AgendamentoItem) => void;
  onConfirmarPrevisto?: (agendamento: AgendamentoItem) => void;
}

type SortField = 'cliente' | 'data' | 'status' | 'quantidade';
type SortDirection = 'asc' | 'desc';

export default function AgendamentoTable({ 
  agendamentos, 
  onCriarPedido, 
  onEditarAgendamento,
  onConfirmarPrevisto 
}: AgendamentoTableProps) {
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAgendamentos = useMemo(() => {
    return [...agendamentos].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'cliente':
          valueA = a.cliente.nome.toLowerCase();
          valueB = b.cliente.nome.toLowerCase();
          break;
        case 'data':
          valueA = new Date(a.dataReposicao);
          valueB = new Date(b.dataReposicao);
          break;
        case 'status':
          valueA = a.statusAgendamento.toLowerCase();
          valueB = b.statusAgendamento.toLowerCase();
          break;
        case 'quantidade':
          valueA = a.pedido?.totalPedidoUnidades || a.cliente.quantidadePadrao || 0;
          valueB = b.pedido?.totalPedidoUnidades || b.cliente.quantidadePadrao || 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [agendamentos, sortField, sortDirection]);

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <div className="h-4 w-4" />
      )}
    </Button>
  );

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

  const getTipoPedidoBadge = (tipoPedido?: string) => {
    if (tipoPedido === 'Alterado') {
      return (
        <Badge variant="destructive" className="bg-red-500 text-white">
          Alterado
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="bg-green-500 text-white">
        Padrão
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="cliente">Cliente</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="data">Data</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="quantidade">Quantidade</SortButton>
            </TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Tipo Pedido</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.map((agendamento, index) => (
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
                  {agendamento.isPedidoUnico ? "Único" : "PDV"}
                </Badge>
              </TableCell>
              <TableCell>
                {getTipoPedidoBadge(agendamento.pedido?.tipoPedido)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {agendamento.statusAgendamento === "Previsto" && onConfirmarPrevisto && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onConfirmarPrevisto(agendamento)}
                      className="flex items-center gap-1 bg-green-500 hover:bg-green-600"
                    >
                      <Check className="h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCriarPedido(agendamento.cliente.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditarAgendamento(agendamento)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
