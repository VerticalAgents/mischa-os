
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AgendamentoItem } from "./types";

interface AgendamentoFiltersProps {
  abaAtiva: string;
  onAbaChange: (aba: string) => void;
  agendamentos: AgendamentoItem[];
}

export default function AgendamentoFilters({ abaAtiva, onAbaChange, agendamentos }: AgendamentoFiltersProps) {
  const contadores = {
    todos: agendamentos.length,
    previstos: agendamentos.filter(a => a.statusAgendamento === "Previsto").length,
    agendados: agendamentos.filter(a => a.statusAgendamento === "Agendado").length,
    pedidosUnicos: agendamentos.filter(a => a.isPedidoUnico).length
  };

  return (
    <Tabs value={abaAtiva} onValueChange={onAbaChange}>
      <TabsList>
        <TabsTrigger value="todos" className="flex items-center gap-2">
          Todos
          <Badge variant="secondary">{contadores.todos}</Badge>
        </TabsTrigger>
        <TabsTrigger value="previstos" className="flex items-center gap-2">
          Previstos
          <Badge variant="secondary">{contadores.previstos}</Badge>
        </TabsTrigger>
        <TabsTrigger value="agendados" className="flex items-center gap-2">
          Agendados
          <Badge variant="secondary">{contadores.agendados}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pedidos-unicos" className="flex items-center gap-2">
          Pedidos Únicos
          <Badge variant="secondary">{contadores.pedidosUnicos}</Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
