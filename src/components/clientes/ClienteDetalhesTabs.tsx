
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cliente } from "@/types";
import ClienteDetalhesInfo from "./ClienteDetalhesInfo";
import AgendamentoAtual from "./AgendamentoAtual";
import AnaliseGiro from "./AnaliseGiro";
import { HistoricoEntregasCliente } from "./HistoricoEntregasCliente";

interface ClienteDetalhesTabsProps {
  cliente: Cliente;
  onAgendamentoUpdate?: () => void;
  refreshTrigger?: number;
}

export default function ClienteDetalhesTabs({ 
  cliente, 
  onAgendamentoUpdate,
  refreshTrigger 
}: ClienteDetalhesTabsProps) {
  return (
    <Tabs defaultValue="informacoes" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="informacoes">Informações</TabsTrigger>
        <TabsTrigger value="agendamento">Agendamento Atual</TabsTrigger>
        <TabsTrigger value="analise">Análise de Giro</TabsTrigger>
        <TabsTrigger value="historico">Histórico de Entregas</TabsTrigger>
      </TabsList>

      <TabsContent value="informacoes">
        <ClienteDetalhesInfo cliente={cliente} />
      </TabsContent>

      <TabsContent value="agendamento">
        <AgendamentoAtual 
          cliente={cliente} 
          onAgendamentoUpdate={onAgendamentoUpdate}
          key={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="analise">
        <AnaliseGiro cliente={cliente} />
      </TabsContent>

      <TabsContent value="historico">
        <HistoricoEntregasCliente cliente={cliente} />
      </TabsContent>
    </Tabs>
  );
}
