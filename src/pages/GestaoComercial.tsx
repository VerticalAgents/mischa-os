
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building, HelpingHand, UserCircle, Users } from "lucide-react";
import FunilLeads from "./gestao-comercial/FunilLeads";
import Distribuidores from "./gestao-comercial/Distribuidores";
import Parceiros from "./gestao-comercial/Parceiros";
import Representantes from "./gestao-comercial/Representantes";
import { useGestaoComercialUiStore } from "@/hooks/useGestaoComercialUiStore";

export default function GestaoComercial() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Usar store para persistir estado
  const { activeTab, setActiveTab } = useGestaoComercialUiStore();
  
  // Sincronização com a URL
  const tabFromUrl = searchParams.get('tab');
  
  // Sincronizar com URL ao montar (apenas reagir a mudanças na URL)
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab) {
      // Se não há tab na URL, usar a do store e atualizar a URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', activeTab);
        return newParams;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Atualizar URL sem reload preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', value);
      return newParams;
    }, { replace: true });
  };

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Gestão Comercial"
        description="Gerencie representantes, leads, distribuidores e parcerias comerciais"
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Always visible tabs at the top */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
          <div className="container mx-auto py-4">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="representantes" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Representantes</span>
              </TabsTrigger>
              <TabsTrigger value="funil-leads" className="flex items-center gap-2">
                <UserCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Funil de Leads</span>
              </TabsTrigger>
              <TabsTrigger value="distribuidores" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Distribuidores</span>
              </TabsTrigger>
              <TabsTrigger value="parceiros" className="flex items-center gap-2">
                <HelpingHand className="h-4 w-4" />
                <span className="hidden sm:inline">Parceiros</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab content with forceMount for critical tabs */}
        <div className="mt-6">
          <TabsContent value="representantes" forceMount={activeTab === "representantes" ? true : undefined}>
            {activeTab === "representantes" && <Representantes />}
          </TabsContent>

          <TabsContent value="funil-leads" forceMount={activeTab === "funil-leads" ? true : undefined}>
            {activeTab === "funil-leads" && <FunilLeads />}
          </TabsContent>

          <TabsContent value="distribuidores">
            {activeTab === "distribuidores" && <Distribuidores />}
          </TabsContent>

          <TabsContent value="parceiros">
            {activeTab === "parceiros" && <Parceiros />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
