import { useEffect } from "react";
import { useRoutePermission } from "@/hooks/useRolePermissions";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle, Users } from "lucide-react";
import FunilLeads from "./gestao-comercial/FunilLeads";
import RepresentantesOptimized from "./gestao-comercial/RepresentantesOptimized";
import { useGestaoComercialUiStore } from "@/hooks/useGestaoComercialUiStore";

const ABAS_VALIDAS = ["representantes", "funil-leads"];

export default function GestaoComercial() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Usar store para persistir estado
  const { activeTab: abaSalva, setActiveTab } = useGestaoComercialUiStore();

  // Abas removidas podem ter ficado salvas no navegador ou na URL
  const activeTab = ABAS_VALIDAS.includes(abaSalva) ? abaSalva : "representantes";

  useEffect(() => {
    if (!ABAS_VALIDAS.includes(abaSalva)) {
      setActiveTab("representantes");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abaSalva]);
  
  // Sincronização com a URL
  const tabFromUrl = searchParams.get('tab');
  
  // Sincronizar com URL ao montar (apenas reagir a mudanças na URL)
  useEffect(() => {
    if (tabFromUrl && ABAS_VALIDAS.includes(tabFromUrl) && tabFromUrl !== activeTab) {
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

  const { canEdit } = useRoutePermission('/gestao-comercial');

  return (
    <EditPermissionProvider value={{ canEdit }}>
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Gestão Comercial"
        description="Gerencie representantes, leads, distribuidores e parcerias comerciais"
      />

        <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="mt-6"
      >
        {/* Mobile: grid 2 colunas */}
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          {[
            { id: "representantes", label: "Dashboard" },
            { id: "funil-leads", label: "Funil de Leads" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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
        <TabsList className="hidden lg:inline-flex w-full justify-start">
          <TabsTrigger value="representantes" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="funil-leads" className="flex items-center gap-2">
            <UserCircle className="h-4 w-4" />
            Funil de Leads
          </TabsTrigger>
        </TabsList>

        <TabsContent value="representantes" className="space-y-6 mt-6" forceMount={activeTab === "representantes" ? true : undefined}>
          <RepresentantesOptimized isActive={activeTab === "representantes"} />
        </TabsContent>

        <TabsContent value="funil-leads" className="space-y-6 mt-6" forceMount={activeTab === "funil-leads" ? true : undefined}>
          {activeTab === "funil-leads" && <FunilLeads />}
        </TabsContent>
      </Tabs>
    </div>
    </EditPermissionProvider>
  );
}
