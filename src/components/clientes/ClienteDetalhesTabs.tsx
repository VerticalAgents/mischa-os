
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cliente } from "@/types";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import ClienteDetalhesInfo from "./ClienteDetalhesInfo";
import AgendamentoAtual from "./AgendamentoAtual";
import AnaliseGiro from "./AnaliseGiro";
import { HistoricoEntregasCliente } from "./HistoricoEntregasCliente";
import ClienteFinanceiro from "./ClienteFinanceiro";

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
  const { activeTab, changeTab } = useTabPersistence("informacoes");

  return (
    <Tabs value={activeTab} onValueChange={changeTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 h-12 bg-gray-100 rounded-lg p-1">
        <TabsTrigger 
          value="informacoes" 
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
        >
          Informações
        </TabsTrigger>
        <TabsTrigger 
          value="agendamento"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
        >
          Agendamento Atual
        </TabsTrigger>
        <TabsTrigger 
          value="analise"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
        >
          Análise de Giro
        </TabsTrigger>
        <TabsTrigger 
          value="financeiro"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
        >
          Financeiro
        </TabsTrigger>
        <TabsTrigger 
          value="historico"
          className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
        >
          Histórico de Entregas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="informacoes" className="mt-6">
        <ClienteDetalhesInfo cliente={cliente} />
      </TabsContent>

      <TabsContent value="agendamento" className="mt-6">
        <AgendamentoAtual 
          cliente={cliente} 
          onAgendamentoUpdate={onAgendamentoUpdate}
          key={refreshTrigger}
        />
      </TabsContent>

      <TabsContent value="analise" className="mt-6">
        <AnaliseGiro cliente={cliente} />
      </TabsContent>

      <TabsContent value="financeiro" className="mt-6">
        <ClienteFinanceiro cliente={cliente} />
      </TabsContent>

      <TabsContent value="historico" className="mt-6">
        <HistoricoEntregasCliente cliente={cliente} />
      </TabsContent>
    </Tabs>
  );
}
