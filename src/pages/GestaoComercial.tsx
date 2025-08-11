import PageHeader from "@/components/common/PageHeader";
import FunilLeads from "@/components/gestao-comercial/FunilLeads";
import Representantes from "@/components/gestao-comercial/Representantes";
import Distribuidores from "@/components/gestao-comercial/Distribuidores";
import Parceiros from "@/components/gestao-comercial/Parceiros";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTabPersistence } from "@/hooks/useTabPersistence";

export default function GestaoComercial() {
  const { activeTab, changeTab } = useTabPersistence("representantes");

  return (
    <>
      <PageHeader 
        title="Gestão Comercial"
        description="Gestão de representantes, leads e parcerias comerciais"
      />
      
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={changeTab}>
          <TabsList className="grid grid-cols-4 mb-8">
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
    </>
  );
}
