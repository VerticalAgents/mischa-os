
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers } from "lucide-react";

// Import components
import AjusteEstoqueTab from "@/components/pcp/AjusteEstoqueTab";

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
          <TabsTrigger value="projecao-producao" disabled>Projeção de Produção</TabsTrigger>
          <TabsTrigger value="necessidade-diaria" disabled>Necessidade Diária</TabsTrigger>
          <TabsTrigger value="planejamento" disabled>Planejamento</TabsTrigger>
          <TabsTrigger value="historico" disabled>Histórico</TabsTrigger>
        </TabsList>
      
        <TabsContent value="ajuste-estoque" className="space-y-6 mt-6">
          <AjusteEstoqueTab />
        </TabsContent>
        
        <TabsContent value="projecao-producao" className="space-y-6 mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Em desenvolvimento - Aba de Projeção de Produção
          </div>
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6 mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Em desenvolvimento - Aba de Necessidade Diária
          </div>
        </TabsContent>
        
        <TabsContent value="planejamento" className="space-y-6 mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Em desenvolvimento - Aba de Planejamento
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Em desenvolvimento - Aba de Histórico
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
