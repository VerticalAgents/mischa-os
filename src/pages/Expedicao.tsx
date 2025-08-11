
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeparacaoPedidos from '@/components/expedicao/SeparacaoPedidos';
import { Despacho } from '@/components/expedicao/Despacho';
import { HistoricoEntregas } from '@/components/expedicao/HistoricoEntregas';
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";
import { useTabPersistenceV2 } from "@/hooks/useTabPersistenceV2";

export default function Expedicao() {
  const { activeTab, setActiveTab, entregasTab, setEntregasTab } = useExpedicaoUiStore();
  
  useTabPersistenceV2('expedicao', activeTab, setActiveTab);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Expedição</h1>
        <p className="text-muted-foreground">
          Gerencie separação, despacho e histórico de entregas
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="separacao">Separação</TabsTrigger>
          <TabsTrigger value="despacho">Despacho</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="separacao" className="space-y-4" forceMount>
          <SeparacaoPedidos />
        </TabsContent>

        <TabsContent value="despacho" className="space-y-4" forceMount>
          <Tabs value={entregasTab} onValueChange={setEntregasTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
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
  );
}
