
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgendamentoItem } from "./types";
import { useConfirmationScore } from "@/hooks/useConfirmationScore";
import ConfirmationScoreBadge from "./ConfirmationScoreBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge";
import AgendamentoEditModal from "./AgendamentoEditModal";
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import SortableTableHeader from "@/components/common/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";

export default function AgendamentosAgendados() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  // Filtrar apenas agendamentos agendados
  const agendamentosAgendados = agendamentos.filter(
    agendamento => agendamento.statusAgendamento === "Agendado"
  );

  // Filtrar agendamentos com base no termo de pesquisa
  const filteredAgendamentos = useMemo(() => {
    if (!searchTerm.trim()) return agendamentosAgendados;
    
    const term = searchTerm.toLowerCase();
    return agendamentosAgendados.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(term) ||
      (agendamento.pedido?.tipoPedido || 'Padrão').toLowerCase().includes(term)
    );
  }, [agendamentosAgendados, searchTerm]);

  // Use the new table sort hook
  const { sortedData: sortedAgendamentos, sortConfig, requestSort } = useTableSort(
    filteredAgendamentos, 
    'dataReposicao'
  );

  const { scores, loading: scoresLoading } = useConfirmationScore(filteredAgendamentos);

  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  const handleEditarAgendamento = (agendamento: AgendamentoItem) => {
    setSelectedAgendamento(agendamento);
    setOpen(true);
  };

  const handleSalvarAgendamento = (agendamentoAtualizado: AgendamentoItem) => {
    carregarTodosAgendamentos();
  };

  return (
    <div className="space-y-4">
      {/* Filtro de Pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por cliente ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <div className="text-sm text-muted-foreground">
          {sortedAgendamentos.length} agendamento(s) agendados
        </div>
      </div>

      <Table>
        <TableCaption>Lista de agendamentos confirmados.</TableCaption>
        <TableHeader>
          <TableRow>
            <SortableTableHeader
              sortKey="cliente.nome"
              sortConfig={sortConfig}
              onSort={requestSort}
            >
              PDV
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="dataReposicao"
              sortConfig={sortConfig}
              onSort={requestSort}
            >
              Data Reposição
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="statusAgendamento"
              sortConfig={sortConfig}
              onSort={requestSort}
            >
              Status
            </SortableTableHeader>
            <SortableTableHeader
              sortKey="pedido.tipoPedido"
              sortConfig={sortConfig}
              onSort={requestSort}
            >
              Tipo
            </SortableTableHeader>
            <TableHead>Prob.</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.map((agendamento) => (
            <TableRow key={agendamento.cliente.id}>
              <TableCell>{agendamento.cliente.nome}</TableCell>
              <TableCell>
                {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <Badge variant="default">Agendado</Badge>
              </TableCell>
              <TableCell>
                <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
              </TableCell>
              <TableCell>
                <ConfirmationScoreBadge score={scores.get(agendamento.cliente.id)} loading={scoresLoading} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleEditarAgendamento(agendamento)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AgendamentoEditModal
        open={open}
        onOpenChange={setOpen}
        agendamento={selectedAgendamento}
        onSalvar={handleSalvarAgendamento}
      />
    </div>
  );
}
