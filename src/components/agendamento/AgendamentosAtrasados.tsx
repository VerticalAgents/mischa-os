import { useState, useEffect, useMemo } from "react";
import { format, addDays, isWeekend } from "date-fns";
import { registrarReagendamentoEntreSemanas } from "@/utils/reagendamentoUtils";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { AgendamentoItem } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Calendar, Search } from "lucide-react";
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
import SortDropdown, { SortField, SortDirection } from "./SortDropdown";

// Função para obter o próximo dia útil
const getProximoDiaUtil = (data: Date): Date => {
  let proximaData = addDays(data, 1);
  while (isWeekend(proximaData)) {
    proximaData = addDays(proximaData, 1);
  }
  return proximaData;
};

export default function AgendamentosAtrasados() {
  const [open, setOpen] = useState(false);
  const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { agendamentos, carregarTodosAgendamentos, salvarAgendamento } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();

  // Ordenação padrão por data (mais antigos primeiro)
  const [sortField, setSortField] = useState<SortField>('data');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filtrar agendamentos atrasados:
  // 1. Status "Previsto" com data anterior a hoje
  // 2. Status "Agendado" com data anterior a hoje, EXCETO os que têm substatus "despachado"
  const agendamentosAtrasados = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    return agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      dataAgendamento.setHours(0, 0, 0, 0);
      
      // Data deve ser anterior a hoje
      if (dataAgendamento >= hoje) {
        return false;
      }
      
      // Agendamentos previstos com data anterior a hoje
      if (agendamento.statusAgendamento === 'Previsto') {
        return true;
      }
      
      // Agendamentos com status "Agendado" com data anterior a hoje, EXCETO os despachados
      if (agendamento.statusAgendamento === 'Agendado') {
        const substatus = agendamento.substatus_pedido;
        return substatus !== 'Despachado';
      }
      
      return false;
    });
  }, [agendamentos]);

  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtrar agendamentos com base no termo de pesquisa
  const filteredAgendamentos = useMemo(() => {
    if (!searchTerm.trim()) return agendamentosAtrasados;
    
    const term = searchTerm.toLowerCase();
    return agendamentosAtrasados.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(term) ||
      agendamento.statusAgendamento.toLowerCase().includes(term) ||
      (agendamento.pedido?.tipoPedido || 'Padrão').toLowerCase().includes(term)
    );
  }, [agendamentosAtrasados, searchTerm]);

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

  const handleReagendamentoEmMassa = async () => {
    try {
      const hoje = new Date();
      const proximoDiaUtil = getProximoDiaUtil(hoje);
      
      console.log('Reagendamento em massa para:', format(proximoDiaUtil, "dd/MM/yyyy", { locale: ptBR }));
      
      const promises = sortedAgendamentos.map(async (agendamento) => {
        // Registrar reagendamento entre semanas se aplicável
        const dataOriginal = new Date(agendamento.dataReposicao);
        await registrarReagendamentoEntreSemanas(agendamento.cliente.id, dataOriginal, proximoDiaUtil);

        await salvarAgendamento(agendamento.cliente.id, {
          data_proxima_reposicao: proximoDiaUtil
        });
      });

      await Promise.all(promises);
      await carregarTodosAgendamentos();
      await carregarClientes();
      
      toast({
        title: "Reagendamento realizado",
        description: `${sortedAgendamentos.length} agendamento(s) reagendados para ${format(proximoDiaUtil, "dd/MM/yyyy", { locale: ptBR })}`,
      });
    } catch (error) {
      console.error('Erro no reagendamento em massa:', error);
      toast({
        title: "Erro",
        description: "Erro ao reagendar agendamentos",
        variant: "destructive",
      });
    }
  };

  const calcularDiasAtraso = (dataAgendamento: Date): number => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const data = new Date(dataAgendamento);
    data.setHours(0, 0, 0, 0);
    const diffTime = hoje.getTime() - data.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Se não há agendamentos atrasados, não renderizar nada
  if (sortedAgendamentos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Filtro de Pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Pesquisar por cliente, status ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {sortedAgendamentos.length > 0 && (
          <Button
            variant="default"
            onClick={handleReagendamentoEmMassa}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Reagendar Todos
          </Button>
        )}
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
          {sortedAgendamentos.length} agendamento(s) atrasados
        </div>
      </div>

      <Table>
        <TableCaption>Lista de agendamentos atrasados: previstos com data anterior a hoje e agendados não despachados com data anterior a hoje.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>PDV</TableHead>
            <TableHead>Data Agendada</TableHead>
            <TableHead>Dias de Atraso</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAgendamentos.map((agendamento) => {
            const diasAtraso = calcularDiasAtraso(agendamento.dataReposicao);
            return (
              <TableRow key={agendamento.cliente.id}>
                <TableCell>{agendamento.cliente.nome}</TableCell>
                <TableCell>
                  {format(agendamento.dataReposicao, "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    {diasAtraso} dia{diasAtraso !== 1 ? 's' : ''}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      agendamento.statusAgendamento === "Agendado" ? "default" :
                      agendamento.statusAgendamento === "Previsto" ? "outline" : "secondary"
                    }
                  >
                    {agendamento.statusAgendamento}
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
            );
          })}
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
