
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import InsumosSupabaseTab from "@/components/precificacao/InsumosSupabaseTab";
import ReceitasTab from "@/components/precificacao/ReceitasTab";
import ProdutosTab from "@/components/precificacao/ProdutosTab";

export default function Precificacao() {
  const [activeTab, setActiveTab] = useState("insumos");
  
  return (
    <>
      <PageHeader 
        title="Precificação"
        description="Sistema integrado de gestão de insumos, receitas e produtos com banco de dados unificado"
      />
      
      <div className="mt-8">
        <Tabs defaultValue="insumos" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="receitas">Receitas Base</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insumos">
            <InsumosSupabaseTab />
          </TabsContent>
          
          <TabsContent value="receitas">
            <CollapsibleSection title="Receitas Base" defaultOpen={true}>
              <ReceitasTab />
            </CollapsibleSection>
          </TabsContent>
          
          <TabsContent value="produtos">
            <CollapsibleSection title="Produtos" defaultOpen={true}>
              <ProdutosTab />
            </CollapsibleSection>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
