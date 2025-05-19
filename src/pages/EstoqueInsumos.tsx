
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsumosTabs from "@/components/estoque/InsumosTabs";

export default function EstoqueInsumos() {
  const [activeTab, setActiveTab] = useState("estoque");

  return (
    <>
      <PageHeader 
        title="Gestão de Insumos" 
        description="Estoque, cotações e pedidos de compra em um só lugar"
        icon={<Package className="h-5 w-5" />}
        backLink="/estoque"
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="estoque">Estoque</TabsTrigger>
            <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos de Compra</TabsTrigger>
          </TabsList>
          
          <TabsContent value="estoque">
            <InsumosTabs.EstoqueTab />
          </TabsContent>
          
          <TabsContent value="cotacoes">
            <InsumosTabs.CotacoesTab />
          </TabsContent>
          
          <TabsContent value="pedidos">
            <InsumosTabs.PedidosTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
