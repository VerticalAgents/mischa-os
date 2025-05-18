
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InsumosTab from "@/components/precificacao/InsumosTab";
import ReceitasTab from "@/components/precificacao/ReceitasTab";
import ProdutosTab from "@/components/precificacao/ProdutosTab";

export default function Precificacao() {
  const [activeTab, setActiveTab] = useState("insumos");
  
  return (
    <>
      <PageHeader 
        title="Precificação"
        description="Gerenciamento de insumos, receitas e produtos"
      />
      
      <div className="mt-8">
        <Tabs defaultValue="insumos" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="receitas">Receitas Base</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insumos">
            <InsumosTab />
          </TabsContent>
          
          <TabsContent value="receitas">
            <ReceitasTab />
          </TabsContent>
          
          <TabsContent value="produtos">
            <ProdutosTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
