
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InsumosSupabaseTab from "@/components/precificacao/InsumosSupabaseTab";
import ReceitasTab from "@/components/precificacao/ReceitasTab";
import ProdutosTab from "@/components/precificacao/ProdutosTab";
import RendimentoReceitasProdutos from "@/components/precificacao/RendimentoReceitasProdutos";
import { useTabPersistence } from "@/hooks/useTabPersistence";

export default function Precificacao() {
  const { activeTab, changeTab } = useTabPersistence("insumos");
  
  return (
    <>
      <PageHeader 
        title="Precificação"
        description="Sistema integrado de gestão de insumos, receitas e produtos com banco de dados unificado"
      />
      
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={changeTab}>
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="receitas">Receitas Base</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="rendimentos">Rendimentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insumos">
            <InsumosSupabaseTab />
          </TabsContent>
          
          <TabsContent value="receitas">
            <ReceitasTab />
          </TabsContent>
          
          <TabsContent value="produtos">
            <ProdutosTab />
          </TabsContent>
          
          <TabsContent value="rendimentos">
            <RendimentoReceitasProdutos />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
