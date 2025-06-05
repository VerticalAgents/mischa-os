
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
import { useClienteStore } from "@/hooks/useClienteStore";
import AgendamentoEditModal from "./AgendamentoEditModal";
import { TipoPedidoBadge } from "@/components/expedicao/TipoPedidoBadge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { toast } from "sonner";

export default function TodosAgendamentos() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const { agendamentos, carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();
  const { obterAgendamento, salvarAgendamento } = useAgendamentoClienteStore();

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

  const handleConfirmarAgendamento = async (agendamento: AgendamentoItem) => {
    try {
      console.log('TodosAgendamentos: Confirmando agendamento previsto para cliente:', agendamento.cliente.nome);

      const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
      
      if (agendamentoAtual) {
        console.log('✅ Preservando dados do agendamento:', {
          tipo: agendamentoAtual.tipo_pedido,
          itens: !!agendamentoAtual.itens_personalizados,
          quantidade: agendamentoAtual.quantidade_total,
          data_atual: agendamentoAtual.data_proxima_reposicao
        });

        // Alterar apenas o status para "Agendado", preservando todos os outros dados
        await salvarAgendamento(agendamento.cliente.id, {
          status_agendamento: 'Agendado',
          // Preservar TODOS os dados existentes sem alteração
          data_proxima_reposicao: agendamentoAtual.data_proxima_reposicao,
          quantidade_total: agendamentoAtual.quantidade_total,
          tipo_pedido: agendamentoAtual.tipo_pedido,
          itens_personalizados: agendamentoAtual.itens_personalizados
        });

        console.log('✅ Agendamento confirmado (Previsto → Agendado)');
      }
      
      await carregarTodosAgendamentos();
      await carregarClientes();
      
      toast.success(`Agendamento confirmado para ${agendamento.cliente.nome}`);
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast.error("Erro ao confirmar agendamento");
    }
  };

  return (
    <>
      <Table>
        <TableCaption>Lista de todos os agendamentos de reposição.</TableCaption>
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
          {agendamentos.map((agendamento) => (
            <TableRow key={agendamento.cliente.id}>
              <TableCell>{agendamento.cliente.nome}</TableCell>
              <TableCell>
                {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell>
                {agendamento.statusAgendamento === "Agendado" ? (
                  <Badge variant="default" className="bg-green-500 text-white">
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Agendado
                  </Badge>
                ) : (
                  <Badge variant="outline">{agendamento.statusAgendamento}</Badge>
                )}
              </TableCell>
              <TableCell>
                <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {agendamento.statusAgendamento === "Previsto" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleConfirmarAgendamento(agendamento)}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCheck className="mr-2 h-4 w-4" />
                      Confirmar
                    </Button>
                  )}
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
