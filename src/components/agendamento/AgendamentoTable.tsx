
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { AgendamentoItem } from "./types";
import { Edit, Plus, Check, ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

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
  // Ordenação padrão por data (mais próxima primeiro)
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
          valueA = new Date(a.dataReposicao).getTime();
          valueB = new Date(b.dataReposicao).getTime();
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
      className="h-auto p-1 font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 -ml-1"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4 text-primary" />
        ) : (
          <ChevronDown className="h-4 w-4 text-primary" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
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
            <TableHead className="w-[200px]">
              <SortButton field="cliente">Cliente</SortButton>
            </TableHead>
            <TableHead className="w-[120px]">
              <SortButton field="data">Data</SortButton>
            </TableHead>
            <TableHead className="w-[100px]">
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead className="w-[100px]">
              <SortButton field="quantidade">Quantidade</SortButton>
            </TableHead>
            <TableHead className="w-[80px]">Tipo</TableHead>
            <TableHead className="w-[100px]">Tipo Pedido</TableHead>
            <TableHead className="text-right w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum agendamento encontrado
              </TableCell>
            </TableRow>
          ) : (
            sortedAgendamentos.map((agendamento, index) => (
              <TableRow key={`${agendamento.cliente.id}-${index}`} className="hover:bg-muted/50">
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
                <TableCell className="font-medium">
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
                  <div className="flex gap-1 justify-end">
                    {agendamento.statusAgendamento === "Previsto" && onConfirmarPrevisto && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onConfirmarPrevisto(agendamento)}
                        className="flex items-center gap-1 bg-green-500 hover:bg-green-600 h-8 px-2"
                      >
                        <Check className="h-3 w-3" />
                        Confirmar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onCriarPedido(agendamento.cliente.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditarAgendamento(agendamento)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
