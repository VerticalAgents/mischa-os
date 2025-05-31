
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
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
import { useClienteStore } from "@/hooks/useClienteStore";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { TipoPedidoBadge } from "@/components/expedicao/TipoPedidoBadge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";

export default function AgendamentosAgendados() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();
  const { obterAgendamento, salvarAgendamento } = useAgendamentoClienteStore();

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

  const handleConfirmarEntrega = async (agendamento: AgendamentoItem) => {
    try {
      console.log('AgendamentosAgendados: Confirmando entrega para cliente:', agendamento.cliente.nome);

      const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
      
      if (agendamentoAtual) {
        // Calcular próxima data (adicionar 7 dias) e alterar status para "Previsto"
        const proximaData = new Date(agendamentoAtual.data_proxima_reposicao || new Date());
        proximaData.setDate(proximaData.getDate() + 7);

        await salvarAgendamento(agendamento.cliente.id, {
          status_agendamento: 'Previsto',
          data_proxima_reposicao: proximaData,
          quantidade_total: agendamentoAtual.quantidade_total,
          tipo_pedido: agendamentoAtual.tipo_pedido,
          itens_personalizados: agendamentoAtual.itens_personalizados
        });

        console.log('✅ Entrega confirmada e reagendada para:', proximaData);
      }
      
      await carregarTodosAgendamentos();
      await carregarClientes();
      
      toast({
        title: "Sucesso",
        description: `Entrega confirmada e reagendamento criado para ${agendamento.cliente.nome}`,
      });
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar entrega",
        variant: "destructive",
      });
    }
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
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleConfirmarEntrega(agendamento)}
                  >
                    Confirmar Entrega
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditarAgendamento(agendamento)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                </div>
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
