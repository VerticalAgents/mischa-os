
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgendamentoItem {
  cliente: { id: number; nome: string; contatoNome?: string; contatoTelefone?: string };
  pedido?: any;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface AgendamentoFiltersProps {
  abaAtiva: string;
  setAbaAtiva: (aba: string) => void;
  agendamentos: AgendamentoItem[];
  children: React.ReactNode;
}

export default function AgendamentoFilters({
  abaAtiva,
  setAbaAtiva,
  agendamentos,
  children
}: AgendamentoFiltersProps) {
  const getContadorAba = (aba: string) => {
    switch (aba) {
      case "previstos":
        return agendamentos.filter(a => a.statusAgendamento === "Previsto").length;
      case "agendados":
        return agendamentos.filter(a => a.statusAgendamento === "Agendado").length;
      case "pedidos-unicos":
        return agendamentos.filter(a => a.isPedidoUnico).length;
      default:
        return agendamentos.length;
    }
  };

  return (
    <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="todos" className="flex items-center gap-2">
          Todos
          <Badge variant="secondary" className="text-xs">
            {getContadorAba("todos")}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="previstos" className="flex items-center gap-2">
          Previstos
          <Badge variant="secondary" className="text-xs">
            {getContadorAba("previstos")}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="agendados" className="flex items-center gap-2">
          Agendados
          <Badge variant="secondary" className="text-xs">
            {getContadorAba("agendados")}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="pedidos-unicos" className="flex items-center gap-2">
          Pedidos Únicos
          <Badge variant="secondary" className="text-xs">
            {getContadorAba("pedidos-unicos")}
          </Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value={abaAtiva} className="space-y-4">
        {children}
      </TabsContent>
    </Tabs>
  );
}
