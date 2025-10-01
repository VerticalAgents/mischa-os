
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers } from "lucide-react";
import { useTabPersistence } from "@/hooks/useTabPersistence";

// Import components
import HistoricoAnalytics from "@/components/pcp/HistoricoAnalytics";
import ProjecaoProducaoTab from "@/components/pcp/ProjecaoProducaoTab";
import NecessidadeDiariaTab from "@/components/pcp/NecessidadeDiariaTab";
import ProducaoAgendadaTab from "@/components/pcp/ProducaoAgendadaTab";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";
import AuditoriaPCPTab from "@/components/pcp/AuditoriaPCPTab";

export default function PCP() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, changeTab } = useTabPersistence("historico");
  
  // Sincronização com a URL
  const tabFromUrl = searchParams.get('tab');
  
  // Sincronizar com URL ao montar (apenas uma vez)
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      changeTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab) {
      // Se não há tab na URL, usar a do store e atualizar a URL
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev);
        newParams.set('tab', activeTab);
        return newParams;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]); // Apenas reagir a mudanças na URL

  const handleTabChange = (value: string) => {
    changeTab(value);
    
    // Atualizar URL sem reload preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', value);
      return newParams;
    }, { replace: true });
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="PCP - Planejamento e Controle da Produção" 
        description="Gerencie a produção, estoques e planejamento de forma integrada"
        icon={<Layers className="h-6 w-6" />}
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="projecao-producao">Projeção de Produção</TabsTrigger>
          <TabsTrigger value="necessidade-diaria">Necessidade Diária</TabsTrigger>
          <TabsTrigger value="producao-agendada">Produção Agendada</TabsTrigger>
          <TabsTrigger value="registro">Registro</TabsTrigger>
          <TabsTrigger value="auditoria-pcp">Auditoria PCP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projecao-producao" className="space-y-6 mt-6" forceMount={activeTab === "projecao-producao" ? true : undefined}>
          {activeTab === "projecao-producao" && <ProjecaoProducaoTab />}
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6 mt-6" forceMount={activeTab === "necessidade-diaria" ? true : undefined}>
          {activeTab === "necessidade-diaria" && <NecessidadeDiariaTab />}
        </TabsContent>
        
        <TabsContent value="producao-agendada" className="space-y-6 mt-6" forceMount={activeTab === "producao-agendada" ? true : undefined}>
          {activeTab === "producao-agendada" && <ProducaoAgendadaTab />}
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 mt-6">
          {activeTab === "historico" && <HistoricoAnalytics />}
        </TabsContent>

        <TabsContent value="registro" className="space-y-6 mt-6">
          {activeTab === "registro" && <HistoricoProducao />}
        </TabsContent>

        <TabsContent value="auditoria-pcp" className="space-y-6 mt-6">
          {activeTab === "auditoria-pcp" && <AuditoriaPCPTab />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
