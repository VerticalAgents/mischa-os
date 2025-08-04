
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgendamentoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, CheckCheck, Search } from "lucide-react";
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
import { useClienteStore } from "@/hooks/useClienteStore";
import SortableTableHeader from "@/components/common/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";

export default function AgendamentosPrevistos() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos, obterAgendamento, salvarAgendamento } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();

  // Filtrar apenas agendamentos previstos
  const agendamentosPrevistos = agendamentos.filter(
    agendamento => agendamento.statusAgendamento === "Previsto"
  );

  // Filtrar agendamentos com base no termo de pesquisa
  const filteredAgendamentos = useMemo(() => {
    if (!searchTerm.trim()) return agendamentosPrevistos;
    
    const term = searchTerm.toLowerCase();
    return agendamentosPrevistos.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(term) ||
      (agendamento.pedido?.tipoPedido || 'Padrão').toLowerCase().includes(term)
    );
  }, [agendamentosPrevistos, searchTerm]);

  // Use the new table sort hook
  const { sortedData: sortedAgendamentos, sortConfig, requestSort } = useTableSort(
    filteredAgendamentos, 
    'dataReposicao'
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

  const handleConfirmarAgendamento = async (agendamento: AgendamentoItem) => {
    try {
      console.log('AgendamentosPrevistos: Confirmando agendamento previsto para cliente:', agendamento.cliente.nome);

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
      
      toast({
        title: "Sucesso",
        description: `Agendamento confirmado para ${agendamento.cliente.nome}`,
      });
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar agendamento",
        variant: "destructive",
      });
    }
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
          {sortedAgendamentos.length} agendamento(s) previstos
        </div>
      </div>

      <Table>
        <TableCaption>Lista de agendamentos previstos.</TableCaption>
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
                <Badge variant="outline">Previsto</Badge>
              </TableCell>
              <TableCell>
                <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConfirmarAgendamento(agendamento)}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Confirmar
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
    </div>
  );
}
