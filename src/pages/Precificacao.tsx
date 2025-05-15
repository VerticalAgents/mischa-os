
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InsumosTab from "@/components/precificacao/InsumosTab";
import ReceitasTab from "@/components/precificacao/ReceitasTab";
import ProdutosTab from "@/components/precificacao/ProdutosTab";
import EstoqueTab from "@/components/precificacao/EstoqueTab";

export default function Precificacao() {
  const [activeTab, setActiveTab] = useState("insumos");
  
  return (
    <>
      <PageHeader 
        title="Precificação"
        description="Gerenciamento de insumos, receitas, produtos e estoque"
      />
      
      <div className="mt-8">
        <Tabs defaultValue="insumos" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="receitas">Receitas Base</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
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
          
          <TabsContent value="estoque">
            <EstoqueTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
