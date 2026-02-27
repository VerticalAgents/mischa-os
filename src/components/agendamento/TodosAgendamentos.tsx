import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgendamentoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, CheckCheck, Search, Calendar } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import AgendamentoEditModal from "./AgendamentoEditModal";
import TipoPedidoBadge from "@/components/expedicao/TipoPedidoBadge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import SortDropdown, { SortField, SortDirection } from "./SortDropdown";
import AgendamentoFilters from "./AgendamentoFilters";
import ReagendamentoEmMassaDialog from "./ReagendamentoEmMassaDialog";
import { registrarReagendamentoEntreSemanas } from "@/utils/reagendamentoUtils";

export default function TodosAgendamentos() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [agendamentosSelecionados, setAgendamentosSelecionados] = useState<Set<string>>(new Set());
  const [modalReagendarAberto, setModalReagendarAberto] = useState(false);
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos, obterAgendamento, salvarAgendamento } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();

  // Ordenação padrão por data (mais próxima primeiro)
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtrar agendamentos excluindo status "Agendar", substatus "Despachado" e também agendamentos despachados
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter(a => 
      a.statusAgendamento !== "Agendar" && 
      a.pedido?.statusPedido !== "Despachado" &&
      a.substatus_pedido !== "Despachado" // NOVO: Excluir agendamentos com substatus "Despachado"
    );
  }, [agendamentos]);

  // Filtrar agendamentos com base no status selecionado
  const agendamentosFiltradosPorStatus = useMemo(() => {
    switch (filtroStatus) {
      case "previstos":
        return agendamentosFiltrados.filter(a => a.statusAgendamento === "Previsto");
      case "agendados":
        return agendamentosFiltrados.filter(a => a.statusAgendamento === "Agendado");
      default:
        return agendamentosFiltrados;
    }
  }, [agendamentosFiltrados, filtroStatus]);

  // Filtrar agendamentos com base no termo de pesquisa
  const filteredAgendamentos = useMemo(() => {
    if (!searchTerm.trim()) return agendamentosFiltradosPorStatus;
    
    const term = searchTerm.toLowerCase();
    return agendamentosFiltradosPorStatus.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(term) ||
      agendamento.statusAgendamento.toLowerCase().includes(term) ||
      (agendamento.pedido?.tipoPedido || 'Padrão').toLowerCase().includes(term) ||
      (agendamento.cliente.cnpjCpf || '').replace(/[.\-\/]/g, '').toLowerCase().includes(term.replace(/[.\-\/]/g, ''))
    );
  }, [agendamentosFiltradosPorStatus, searchTerm]);

  const sortedAgendamentos = useMemo(() => {
    return [...filteredAgendamentos].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'nome':
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
        case 'tipo':
          valueA = a.isPedidoUnico ? 'único' : 'pdv';
          valueB = b.isPedidoUnico ? 'único' : 'pdv';
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
  }, [filteredAgendamentos, sortField, sortDirection]);

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
      console.log('TodosAgendamentos: Confirmando agendamento para cliente:', agendamento.cliente.nome);

      const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
      
      if (agendamentoAtual) {
        console.log('✅ Preservando dados do agendamento:', {
          tipo: agendamentoAtual.tipo_pedido,
          itens: !!agendamentoAtual.itens_personalizados,
          quantidade: agendamentoAtual.quantidade_total,
          data_atual: agendamentoAtual.data_proxima_reposicao
        });

        await salvarAgendamento(agendamento.cliente.id, {
          status_agendamento: 'Agendado',
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

  const toggleSelecao = (clienteId: string) => {
    setAgendamentosSelecionados(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clienteId)) {
        newSet.delete(clienteId);
      } else {
        newSet.add(clienteId);
      }
      return newSet;
    });
  };

  const toggleSelecionarTodos = () => {
    if (agendamentosSelecionados.size === sortedAgendamentos.length) {
      setAgendamentosSelecionados(new Set());
    } else {
      const todosIds = new Set(sortedAgendamentos.map(a => a.cliente.id));
      setAgendamentosSelecionados(todosIds);
    }
  };

  const limparSelecao = () => {
    setAgendamentosSelecionados(new Set());
  };

  const handleReagendarEmMassa = async (clienteIds: string[], novaData: Date) => {
    try {
      const agendamentosParaReagendar = sortedAgendamentos.filter(a => 
        clienteIds.includes(a.cliente.id)
      );

      await Promise.all(
        agendamentosParaReagendar.map(async (agendamento) => {
          const agendamentoAtual = await obterAgendamento(agendamento.cliente.id);
          
          if (agendamentoAtual) {
            // Registrar reagendamento entre semanas se aplicável
            if (agendamentoAtual.data_proxima_reposicao) {
              const dataOriginal = new Date(agendamentoAtual.data_proxima_reposicao);
              await registrarReagendamentoEntreSemanas(agendamento.cliente.id, dataOriginal, novaData);
            }

            await salvarAgendamento(agendamento.cliente.id, {
              data_proxima_reposicao: novaData,
              tipo_pedido: agendamentoAtual.tipo_pedido,
              quantidade_total: agendamentoAtual.quantidade_total,
              itens_personalizados: agendamentoAtual.itens_personalizados,
              status_agendamento: agendamentoAtual.status_agendamento,
            });
          }
        })
      );

      await carregarTodosAgendamentos();
      await carregarClientes();
      limparSelecao();

      toast({
        title: "Sucesso",
        description: `${agendamentosParaReagendar.length} agendamento(s) reagendado(s) com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao reagendar em massa:', error);
      toast({
        title: "Erro",
        description: "Erro ao reagendar agendamentos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <AgendamentoFilters
        abaAtiva="todos"
        onAbaChange={() => {}}
        agendamentos={agendamentosFiltrados}
        filtroStatus={filtroStatus}
        onFiltroStatusChange={setFiltroStatus}
      />

      {/* Filtro de Pesquisa e Botão de Reagendamento em Massa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por cliente, CNPJ, status ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => setModalReagendarAberto(true)}
          disabled={sortedAgendamentos.length === 0}
          className="whitespace-nowrap"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Reagendar em Massa
        </Button>
      </div>

      {/* Controles de Ordenação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Ordenar por:</span>
          <SortDropdown
            sortField={sortField}
            sortDirection={sortDirection}
            onSortChange={handleSortChange}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedAgendamentos.length} agendamento(s) encontrados
        </div>
      </div>

      <Table>
        <TableCaption className="text-left">Lista de agendamentos.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={agendamentosSelecionados.size === sortedAgendamentos.length && sortedAgendamentos.length > 0}
                onCheckedChange={toggleSelecionarTodos}
              />
            </TableHead>
            <TableHead className="text-left">PDV</TableHead>
            <TableHead className="text-left">Data Reposição</TableHead>
            <TableHead className="text-left">Status</TableHead>
            <TableHead className="text-left">Tipo</TableHead>
            <TableHead className="text-left">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.map((agendamento) => (
            <TableRow key={agendamento.cliente.id}>
              <TableCell>
                <Checkbox
                  checked={agendamentosSelecionados.has(agendamento.cliente.id)}
                  onCheckedChange={() => toggleSelecao(agendamento.cliente.id)}
                />
              </TableCell>
              <TableCell className="text-left">{agendamento.cliente.nome}</TableCell>
              <TableCell className="text-left">
                {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                  locale: ptBR,
                })}
              </TableCell>
              <TableCell className="text-left">
                <Badge 
                  variant={
                    agendamento.statusAgendamento === "Agendado" ? "default" :
                    agendamento.statusAgendamento === "Previsto" ? "outline" : "secondary"
                  }
                >
                  {agendamento.statusAgendamento}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <TipoPedidoBadge tipo={agendamento.pedido?.tipoPedido || 'Padrão'} />
              </TableCell>
              <TableCell className="text-left">
                <div className="flex gap-2">
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

      <ReagendamentoEmMassaDialog
        open={modalReagendarAberto}
        onOpenChange={setModalReagendarAberto}
        agendamentosDisponiveis={sortedAgendamentos}
        onConfirm={handleReagendarEmMassa}
      />
    </div>
  );
}
