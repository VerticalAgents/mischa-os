
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendamentoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
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
import { CheckCheck } from "lucide-react";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { TipoPedidoBadge } from "@/components/expedicao/TipoPedidoBadge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";

export default function AgendamentosAgendados() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();

  // Filtrar apenas agendamentos confirmados/agendados
  const agendamentosAgendados = agendamentos.filter(
    agendamento => agendamento.statusAgendamento === "Agendado"
  );

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
    <>
      <Table>
        <TableCaption>Lista de agendamentos confirmados.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>PDV</TableHead>
            <TableHead>Data Reposição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agendamentosAgendados.map((agendamento) => (
            <TableRow key={agendamento.cliente.id}>
              <TableCell>{agendamento.cliente.nome}</TableCell>
              <TableCell>
                {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                <Badge variant="default" className="bg-green-500 text-white">
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Agendado
                </Badge>
              </TableCell>
              <TableCell>
                <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
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
    </>
  );
}
