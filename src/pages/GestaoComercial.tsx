
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UserCircle, BarChart3, Target } from "lucide-react";
import FunilLeads from "./gestao-comercial/FunilLeads";
import DashboardComercial from "./gestao-comercial/DashboardComercial";
import MetasProspeccao from "./gestao-comercial/MetasProspeccao";

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
        description="Gerencie leads, acompanhe dashboards e defina metas de prospecção"
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
              <TabsTrigger value="dashboard" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="metas" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>Metas de Prospecção</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="funil-leads">
            <FunilLeads />
          </TabsContent>

          <TabsContent value="dashboard">
            <DashboardComercial />
          </TabsContent>

          <TabsContent value="metas">
            <MetasProspeccao />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
