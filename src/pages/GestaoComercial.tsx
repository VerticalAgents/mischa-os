
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building, HelpingHand, UserCircle, Users } from "lucide-react";
import FunilLeads from "./gestao-comercial/FunilLeads";
import Distribuidores from "./gestao-comercial/Distribuidores";
import Parceiros from "./gestao-comercial/Parceiros";
import Representantes from "./gestao-comercial/Representantes";

export default function GestaoComercial() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determinar a aba ativa baseada na rota atual
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('funil-leads')) return 'funil-leads';
    if (path.includes('distribuidores')) return 'distribuidores';
    if (path.includes('parceiros')) return 'parceiros';
    return 'representantes';
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/gestao-comercial/${value}`);
  };

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Gestão Comercial"
        description="Gerencie representantes, leads, distribuidores e parcerias comerciais"
      />

      {/* Abas sempre visíveis no topo */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
        <div className="container mx-auto py-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
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
          </Tabs>
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="mt-6">
        <Tabs value={activeTab} className="w-full">
          <TabsContent value="representantes">
            <Representantes />
          </TabsContent>

          <TabsContent value="funil-leads">
            <FunilLeads />
          </TabsContent>

          <TabsContent value="distribuidores">
            <Distribuidores />
          </TabsContent>

          <TabsContent value="parceiros">
            <Parceiros />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
