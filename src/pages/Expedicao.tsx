
import { useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SeparacaoPedidos from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";
import { HistoricoEntregas } from "@/components/expedicao/HistoricoEntregas";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { useExpedicaoUiStore } from "@/hooks/useExpedicaoUiStore";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Expedicao() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Usar stores para persistir estado
  const { 
    activeTab, 
    entregasTab, 
    setActiveTab, 
    setEntregasTab 
  } = useExpedicaoUiStore();
  
  // Sincronização com a URL
  const tabFromUrl = searchParams.get('tab');
  const entregasTabFromUrl = searchParams.get('entregas');
  
  // Usar o hook de sincronização para acesso à função de recarga
  const { recarregarDados } = useExpedicaoSync();
  
  // Sincronizar com URL ao montar
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    if (entregasTabFromUrl && entregasTabFromUrl !== entregasTab) {
      setEntregasTab(entregasTabFromUrl);
    }
  }, [tabFromUrl, entregasTabFromUrl, activeTab, entregasTab, setActiveTab, setEntregasTab]);
  
  // Garantir que ao trocar de aba os dados estejam atualizados
  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);
    
    // Atualizar URL sem reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('tab', newValue);
    setSearchParams(newSearchParams, { replace: true });
    
    recarregarDados(); // Recarrega os dados ao trocar de aba
  };
  
  const handleEntregasTabChange = (newValue: string) => {
    setEntregasTab(newValue);
    
    // Atualizar URL sem reload
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('entregas', newValue);
    setSearchParams(newSearchParams, { replace: true });
    
    recarregarDados(); // Recarrega os dados ao trocar sub-abas
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Expedição" 
        description="Gerenciamento de separação de pedidos e despacho de entregas" 
      />
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="separacao">Separação de Pedidos</TabsTrigger>
          <TabsTrigger value="despacho">Despacho de Pedidos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Entregas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="separacao" className="space-y-4" forceMount={activeTab === "separacao" ? true : undefined}>
          {activeTab === "separacao" && <SeparacaoPedidos />}
        </TabsContent>
        
        <TabsContent value="despacho" className="space-y-4" forceMount={activeTab === "despacho" ? true : undefined}>
          {activeTab === "despacho" && (
            <Tabs value={entregasTab} onValueChange={handleEntregasTabChange} className="space-y-4">
              <TabsList className="w-full border-b">
                <TabsTrigger value="hoje" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700">
                  🟢 Entregas de Hoje
                </TabsTrigger>
                <TabsTrigger value="atrasadas" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-700">
                  🟡 Entregas Atrasadas
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hoje" forceMount={entregasTab === "hoje" ? true : undefined}>
                {entregasTab === "hoje" && <Despacho tipoFiltro="hoje" />}
              </TabsContent>
              
              <TabsContent value="atrasadas" forceMount={entregasTab === "atrasadas" ? true : undefined}>
                {entregasTab === "atrasadas" && <Despacho tipoFiltro="atrasadas" />}
              </TabsContent>
            </Tabs>
          )}
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4" forceMount={activeTab === "historico" ? true : undefined}>
          {activeTab === "historico" && <HistoricoEntregas />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
