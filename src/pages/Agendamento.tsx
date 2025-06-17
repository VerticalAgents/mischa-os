
import { useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TodosAgendamentos from "@/components/agendamento/TodosAgendamentos";
import AgendamentosPrevistos from "@/components/agendamento/AgendamentosPrevistos";
import AgendamentosAgendados from "@/components/agendamento/AgendamentosAgendados";
import ConfirmacaoReposicaoFuncional from "@/components/agendamento/ConfirmacaoReposicaoFuncional";
import { useSearchParams } from "react-router-dom";
import { useTabPersistence } from "@/hooks/useTabPersistence";

export default function Agendamento() {
  const [searchParams] = useSearchParams();
  const { activeTab, changeTab } = useTabPersistence("todos");

  useEffect(() => {
    // Verificar se há parâmetro de tab na URL e atualizar
    const tab = searchParams.get("tab");
    if (tab && ["todos", "previstos", "agendados", "confirmacao"].includes(tab)) {
      changeTab(tab);
    }
  }, [searchParams, changeTab]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Agendamento" 
        description="Gerenciamento de agendamentos e confirmação de reposições" 
      />
      
      <Tabs value={activeTab} onValueChange={changeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos os Agendamentos</TabsTrigger>
          <TabsTrigger value="previstos">Pedidos Previstos</TabsTrigger>
          <TabsTrigger value="agendados">Pedidos Agendados</TabsTrigger>
          <TabsTrigger value="confirmacao">Confirmação de Reposição</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-4">
          <TodosAgendamentos />
        </TabsContent>
        
        <TabsContent value="previstos" className="space-y-4">
          <AgendamentosPrevistos />
        </TabsContent>
        
        <TabsContent value="agendados" className="space-y-4">
          <AgendamentosAgendados />
        </TabsContent>
        
        <TabsContent value="confirmacao" className="space-y-4">
          <ConfirmacaoReposicaoFuncional />
        </TabsContent>
      </Tabs>
    </div>
  );
}
