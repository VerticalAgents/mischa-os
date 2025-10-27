import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsumosTabs from "@/components/estoque/InsumosTabs";
import { useTabPersistence } from "@/hooks/useTabPersistence";
export default function EstoqueInsumos() {
  const location = useLocation();
  const {
    activeTab,
    changeTab
  } = useTabPersistence("produtos");
  useEffect(() => {
    // Verificar se há parâmetro de tab na URL
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['produtos', 'insumos', 'pedidos', 'necessidade'].includes(tabParam)) {
      changeTab(tabParam);
    }
  }, [location.search, changeTab]);
  return <>
      <PageHeader title="Gestão de Estoque" description="Controle completo do estoque de produtos e insumos" icon={<Package className="h-5 w-5" />} />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="pedidos">Compras</TabsTrigger>
          </TabsList>
          
          <TabsContent value="produtos">
            <InsumosTabs.EstoqueProdutosTab />
          </TabsContent>
          
          <TabsContent value="insumos">
            <InsumosTabs.EstoqueInsumosTab />
          </TabsContent>
          
          <TabsContent value="pedidos">
            <InsumosTabs.PedidosTab />
          </TabsContent>
        </Tabs>
      </div>
    </>;
}