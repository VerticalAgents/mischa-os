
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgendamentoItem } from "./types";

interface AgendamentoFiltersProps {
  abaAtiva: string;
  onAbaChange: (aba: string) => void;
  agendamentos: AgendamentoItem[];
  filtroStatus?: string;
  onFiltroStatusChange?: (status: string) => void;
}

export default function AgendamentoFilters({ 
  abaAtiva, 
  onAbaChange, 
  agendamentos, 
  filtroStatus = "todos",
  onFiltroStatusChange 
}: AgendamentoFiltersProps) {
  const contadores = {
    todos: agendamentos.length,
    previstos: agendamentos.filter(a => a.statusAgendamento === "Previsto").length,
    agendados: agendamentos.filter(a => a.statusAgendamento === "Agendado").length,
    pedidosUnicos: agendamentos.filter(a => a.isPedidoUnico).length,
    despachados: agendamentos.filter(a => a.statusAgendamento === "Agendado" && a.pedido?.substatus === "Despachado").length
  };

  const agendamentosFiltrados = () => {
    switch (filtroStatus) {
      case "previstos":
        return agendamentos.filter(a => a.statusAgendamento === "Previsto");
      case "agendados":
        return agendamentos.filter(a => a.statusAgendamento === "Agendado");
      default:
        return agendamentos;
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={abaAtiva} onValueChange={onAbaChange}>
        <TabsList>
          <TabsTrigger value="todos" className="flex items-center gap-2">
            Agendamentos
            <Badge variant="secondary">{contadores.todos}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pedidos-unicos" className="flex items-center gap-2">
            Pedidos Únicos
            <Badge variant="secondary">{contadores.pedidosUnicos}</Badge>
          </TabsTrigger>
          <TabsTrigger value="despachados" className="flex items-center gap-2">
            Despachados
            <Badge variant="secondary">{contadores.despachados}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtro de Status - apenas para a aba "todos" */}
      {abaAtiva === "todos" && onFiltroStatusChange && (
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Filtrar por status:</span>
          <Select value={filtroStatus} onValueChange={onFiltroStatusChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">
                Todos os agendamentos ({contadores.todos})
              </SelectItem>
              <SelectItem value="previstos">
                Previstos ({contadores.previstos})
              </SelectItem>
              <SelectItem value="agendados">
                Agendados ({contadores.agendados})
              </SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {agendamentosFiltrados().length} agendamento(s) encontrados
          </div>
        </div>
      )}
    </div>
  );
}
