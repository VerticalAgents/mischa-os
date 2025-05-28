
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsumosTabs from "@/components/estoque/InsumosTabs";

export default function EstoqueInsumos() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("produtos");

  useEffect(() => {
    // Verifica se há parâmetro de tab na URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    
    if (tabParam && ['produtos', 'insumos', 'cotacoes', 'pedidos'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  return (
    <>
      <PageHeader 
        title="Gestão de Estoque" 
        description="Controle completo do estoque de produtos e insumos"
        icon={<Package className="h-5 w-5" />}
        backLink="/estoque"
      />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="produtos">Produtos Acabados</TabsTrigger>
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="cotacoes">Cotações</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos de Compra</TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtos">
            <InsumosTabs.EstoqueProdutosTab />
          </TabsContent>
          
          <TabsContent value="insumos">
            <InsumosTabs.EstoqueInsumosTab />
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
