
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TodosAgendamentos from "@/components/agendamento/TodosAgendamentos";
import ConfirmacaoReposicaoTab from "@/components/agendamento/ConfirmacaoReposicaoTab";
import { useSearchParams } from "react-router-dom";

export default function Agendamento() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>("todos");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["todos", "confirmacao"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Agendamento" 
        description="Gerenciamento de agendamentos e confirmação de reposições" 
      />
      
      <Tabs defaultValue="todos" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos os Agendamentos</TabsTrigger>
          <TabsTrigger value="confirmacao">Confirmação de Reposição</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-4">
          <TodosAgendamentos />
        </TabsContent>
        
        <TabsContent value="confirmacao" className="space-y-4">
          <ConfirmacaoReposicaoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
