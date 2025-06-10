
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers } from "lucide-react";

// Import components
import AjusteEstoqueTab from "@/components/pcp/AjusteEstoqueTab";
import ProjecaoProducaoTab from "@/components/pcp/ProjecaoProducaoTab";
import NecessidadeDiariaTab from "@/components/pcp/NecessidadeDiariaTab";
import ProducaoAgendadaTab from "@/components/pcp/ProducaoAgendadaTab";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";
import BackendPCPTab from "@/components/pcp/BackendPCPTab";

export default function PCP() {
  const [activeTab, setActiveTab] = useState("ajuste-estoque");

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="PCP - Planejamento e Controle da Produção" 
        description="Gerencie a produção, estoques e planejamento de forma integrada"
        icon={<Layers className="h-6 w-6" />}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="ajuste-estoque">Ajuste de Estoque</TabsTrigger>
          <TabsTrigger value="projecao-producao">Projeção de Produção</TabsTrigger>
          <TabsTrigger value="necessidade-diaria">Necessidade Diária</TabsTrigger>
          <TabsTrigger value="producao-agendada">Produção Agendada</TabsTrigger>
          <TabsTrigger value="backend-pcp">Backend PCP</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
      
        <TabsContent value="ajuste-estoque" className="space-y-6 mt-6">
          <AjusteEstoqueTab />
        </TabsContent>
        
        <TabsContent value="projecao-producao" className="space-y-6 mt-6">
          <ProjecaoProducaoTab />
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6 mt-6">
          <NecessidadeDiariaTab />
        </TabsContent>
        
        <TabsContent value="producao-agendada" className="space-y-6 mt-6">
          <ProducaoAgendadaTab />
        </TabsContent>

        <TabsContent value="backend-pcp" className="space-y-6 mt-6">
          <BackendPCPTab />
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 mt-6">
          <HistoricoProducao />
        </TabsContent>
      </Tabs>
    </div>
  );
}
