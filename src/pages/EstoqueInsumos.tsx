import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsumosTabs from "@/components/estoque/InsumosTabs";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useRoutePermission } from "@/hooks/useRolePermissions";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";
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
  const { canEdit } = useRoutePermission('/estoque/insumos');
  return <EditPermissionProvider value={{ canEdit }}>
      <PageHeader title="Gestão de Estoque" description="Controle completo do estoque de produtos e insumos" icon={<Package className="h-5 w-5" />} />

      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
          {/* Mobile: grid 2 colunas */}
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            {[
              { id: "produtos", label: "Produtos" },
              { id: "insumos", label: "Insumos" },
              { id: "pedidos", label: "Compras" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Desktop */}
          <TabsList className="hidden lg:grid w-full grid-cols-3">
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
    </EditPermissionProvider>;
}