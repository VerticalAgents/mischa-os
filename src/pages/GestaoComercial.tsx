
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FunilLeads from '@/pages/gestao-comercial/FunilLeads';
import Representantes from '@/pages/gestao-comercial/Representantes';
import Distribuidores from '@/pages/gestao-comercial/Distribuidores';
import Parceiros from '@/pages/gestao-comercial/Parceiros';
import { useGestaoComercialUiStore } from "@/hooks/useGestaoComercialUiStore";
import { useTabPersistenceV2 } from "@/hooks/useTabPersistenceV2";

export default function GestaoComercial() {
  const { activeTab, setActiveTab } = useGestaoComercialUiStore();
  
  useTabPersistenceV2('gestao-comercial', activeTab, setActiveTab);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestão Comercial</h1>
        <p className="text-muted-foreground">
          Gerencie representantes, leads e parcerias comerciais
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="representantes">Representantes</TabsTrigger>
          <TabsTrigger value="funil-leads">Funil de Leads</TabsTrigger>
          <TabsTrigger value="distribuidores">Distribuidores</TabsTrigger>
          <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
        </TabsList>

        <TabsContent value="representantes" forceMount>
          <Representantes />
        </TabsContent>

        <TabsContent value="funil-leads" forceMount>
          <FunilLeads />
        </TabsContent>

        <TabsContent value="distribuidores" forceMount>
          <Distribuidores />
        </TabsContent>

        <TabsContent value="parceiros" forceMount>
          <Parceiros />
        </TabsContent>
      </Tabs>
    </div>
  );
}
