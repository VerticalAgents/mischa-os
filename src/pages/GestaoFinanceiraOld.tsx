import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LineChart, Receipt, DollarSign, TrendingUp, Calculator } from "lucide-react";
import { useGestaoFinanceiraOldUiStore } from "@/hooks/useGestaoFinanceiraOldUiStore";
import ResumoFinanceiroTab from "@/components/gestao-financeira/tabs/ResumoFinanceiroTab";
import ProjecoesTab from "@/components/gestao-financeira/tabs/ProjecoesTab";
import CustosTab from "@/components/gestao-financeira/tabs/CustosTab";
import ProjecaoPDVTab from "@/components/gestao-financeira/tabs/ProjecaoPDVTab";
import PontoEquilibrioTab from "@/components/gestao-financeira/tabs/PontoEquilibrioTab";

export default function GestaoFinanceiraOld() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, setActiveTab } = useGestaoFinanceiraOldUiStore();
  
  const tabFromUrl = searchParams.get('tab');
  
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab) {
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
        title="Gestão Financeira OLD" 
        description="Versão anterior - mantida para referência" 
      />

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b mb-6">
          <div className="container mx-auto py-4">
            <TabsList className="grid w-full grid-cols-5 max-w-4xl">
              <TabsTrigger value="resumo" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Resumo</span>
              </TabsTrigger>
              <TabsTrigger value="projecoes" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Projeções</span>
              </TabsTrigger>
              <TabsTrigger value="custos" className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Custos</span>
              </TabsTrigger>
              <TabsTrigger value="projecao-pdv" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Projeção por PDV</span>
              </TabsTrigger>
              <TabsTrigger value="ponto-equilibrio" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Ponto de Equilíbrio</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="mt-6">
          <TabsContent value="resumo" forceMount={activeTab === "resumo" ? true : undefined}>
            {activeTab === "resumo" && <ResumoFinanceiroTab />}
          </TabsContent>

          <TabsContent value="projecoes" forceMount={activeTab === "projecoes" ? true : undefined}>
            {activeTab === "projecoes" && <ProjecoesTab />}
          </TabsContent>

          <TabsContent value="custos">
            {activeTab === "custos" && <CustosTab />}
          </TabsContent>

          <TabsContent value="projecao-pdv">
            {activeTab === "projecao-pdv" && <ProjecaoPDVTab />}
          </TabsContent>

          <TabsContent value="ponto-equilibrio">
            {activeTab === "ponto-equilibrio" && <PontoEquilibrioTab />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
