import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import { SeparacaoPedidos } from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";
import { HistoricoEntregas } from "@/components/expedicao/HistoricoEntregas";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";

export default function Expedicao() {
  const { activeTab, changeTab } = useTabPersistence("separacao");
  const { entregasTab, handleEntregasTabChange } = useExpedicaoUiStore();

  return (
    <>
      <PageHeader 
        title="Expedição"
        description="Separação, despacho e acompanhamento de entregas"
      />
      
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={changeTab}>
          <TabsList className="grid grid-cols-3 mb-8">
            <TabsTrigger value="separacao">Separação</TabsTrigger>
            <TabsTrigger value="despacho">Despacho</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="separacao" className="space-y-4" forceMount>
            <SeparacaoPedidos />
          </TabsContent>

          <TabsContent value="despacho" className="space-y-4" forceMount>
            <Tabs value={entregasTab} onValueChange={handleEntregasTabChange} className="space-y-4">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="hoje">Entregas de Hoje</TabsTrigger>
                <TabsTrigger value="atrasadas">Entregas Atrasadas</TabsTrigger>
              </TabsList>

              <TabsContent value="hoje" forceMount>
                <Despacho tipoFiltro="hoje" />
              </TabsContent>

              <TabsContent value="atrasadas" forceMount>
                <Despacho tipoFiltro="atrasadas" />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4" forceMount>
            <HistoricoEntregas />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
