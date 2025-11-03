import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { useState } from "react";
import IndicadoresTab from "@/components/gestao-financeira/tabs/IndicadoresTab";
import CustosTab from "@/components/gestao-financeira/tabs/CustosTab";
import { DRETab } from "@/components/gestao-financeira/tabs/DRETab";

export default function GestaoFinanceira() {
  const [activeTab, setActiveTab] = useState("resumo");

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader 
        title="Gestão Financeira" 
        description="Visão completa da saúde financeira da empresa" 
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-6">
        <div className="sticky top-0 z-10 bg-background pb-4">
          <TabsList className="grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="resumo" className="text-xs sm:text-sm">Resumo</TabsTrigger>
            <TabsTrigger value="indicadores" className="text-xs sm:text-sm">Indicadores</TabsTrigger>
            <TabsTrigger value="custos" className="text-xs sm:text-sm">Custos</TabsTrigger>
            <TabsTrigger value="dre" className="text-xs sm:text-sm">DRE</TabsTrigger>
            <TabsTrigger value="cenarios" className="text-xs sm:text-sm">Cenários</TabsTrigger>
            <TabsTrigger value="ponto-equilibrio" className="text-xs sm:text-sm">Ponto de Equilíbrio</TabsTrigger>
            <TabsTrigger value="parcelamentos" className="text-xs sm:text-sm">Controle de Parcelamentos</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumo" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Conteúdo em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicadores" className="space-y-6">
          <IndicadoresTab />
        </TabsContent>

        <TabsContent value="custos" className="space-y-6">
          <CustosTab />
        </TabsContent>

        <TabsContent value="dre" className="space-y-6">
          <DRETab />
        </TabsContent>

        <TabsContent value="cenarios" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Conteúdo em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ponto-equilibrio" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Conteúdo em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parcelamentos" className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">Conteúdo em desenvolvimento</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
