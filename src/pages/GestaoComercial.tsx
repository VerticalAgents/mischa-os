
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Building, HelpingHand, UserCircle } from "lucide-react";
import FunilLeads from "./gestao-comercial/FunilLeads";
import Distribuidores from "./gestao-comercial/Distribuidores";
import Parceiros from "./gestao-comercial/Parceiros";

export default function GestaoComercial() {
  const [activeTab, setActiveTab] = useState("funil-leads");
  const navigate = useNavigate();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/gestao-comercial/${value}`);
  };

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Gestão Comercial"
        description="Gerencie leads, distribuidores e parcerias comerciais"
      />

      <div className="mt-6">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <div className="flex mb-8 overflow-x-auto">
            <TabsList className="grid grid-flow-col auto-cols-max gap-2">
              <TabsTrigger value="funil-leads" className="flex items-center gap-1">
                <UserCircle className="h-4 w-4" />
                <span>Funil de Leads</span>
              </TabsTrigger>
              <TabsTrigger value="distribuidores" className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span>Distribuidores</span>
              </TabsTrigger>
              <TabsTrigger value="parceiros" className="flex items-center gap-1">
                <HelpingHand className="h-4 w-4" />
                <span>Parceiros</span>
              </TabsTrigger>
            </TabsList>
          </div>

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
