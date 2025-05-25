
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import ConfirmacaoReposicao from "@/components/agendamento/ConfirmacaoReposicao";
import TodosAgendamentos from "@/components/agendamento/TodosAgendamentos";

export default function Agendamento() {
  const [activeTab, setActiveTab] = useState("todos");

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Agendamento" 
        description="Gerencie entregas e confirmações de reposição"
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="todos">Todos os Agendamentos</TabsTrigger>
          <TabsTrigger value="confirmacao">Confirmação de Reposição</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-6">
          <TodosAgendamentos />
        </TabsContent>
        
        <TabsContent value="confirmacao" className="space-y-6">
          <ConfirmacaoReposicao />
        </TabsContent>
      </Tabs>
    </div>
  );
}
