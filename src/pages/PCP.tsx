
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Layers } from "lucide-react";
import { useTabPersistence } from "@/hooks/useTabPersistence";

// Import components
import ProjecaoProducaoTab from "@/components/pcp/ProjecaoProducaoTab";
import NecessidadeDiariaTab from "@/components/pcp/NecessidadeDiariaTab";
import ProducaoAgendadaTab from "@/components/pcp/ProducaoAgendadaTab";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";
import AuditoriaPCPTab from "@/components/pcp/AuditoriaPCPTab";

export default function PCP() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeTab, changeTab } = useTabPersistence("projecao-producao");
  
  // Sincronização com a URL
  const tabFromUrl = searchParams.get('tab');
  
  // Sincronizar com URL ao montar
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      changeTab(tabFromUrl);
    } else if (!tabFromUrl) {
      // Se não há tab na URL, usar a do store e atualizar a URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('tab', activeTab);
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [tabFromUrl, activeTab, changeTab, searchParams, setSearchParams]);

  const handleTabChange = (value: string) => {
    changeTab(value);
    
    // Atualizar URL sem reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', value);
    setSearchParams(newSearchParams, { replace: true });
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
          <TabsTrigger value="projecao-producao">Projeção de Produção</TabsTrigger>
          <TabsTrigger value="necessidade-diaria">Necessidade Diária</TabsTrigger>
          <TabsTrigger value="producao-agendada">Produção Agendada</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="auditoria-pcp">Auditoria PCP</TabsTrigger>
        </TabsList>
        
        <TabsContent value="projecao-producao" className="space-y-6 mt-6" forceMount={activeTab === "projecao-producao"}>
          {activeTab === "projecao-producao" && <ProjecaoProducaoTab />}
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6 mt-6" forceMount={activeTab === "necessidade-diaria"}>
          {activeTab === "necessidade-diaria" && <NecessidadeDiariaTab />}
        </TabsContent>
        
        <TabsContent value="producao-agendada" className="space-y-6 mt-6" forceMount={activeTab === "producao-agendada"}>
          {activeTab === "producao-agendada" && <ProducaoAgendadaTab />}
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 mt-6">
          {activeTab === "historico" && <HistoricoProducao />}
        </TabsContent>

        <TabsContent value="auditoria-pcp" className="space-y-6 mt-6">
          {activeTab === "auditoria-pcp" && <AuditoriaPCPTab />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
