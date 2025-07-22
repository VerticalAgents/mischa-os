
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeparacaoPedidos } from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";
import { HistoricoEntregas } from "@/components/expedicao/HistoricoEntregas";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";

export default function Expedicao() {
  const [activeTab, setActiveTab] = useState<string>("separacao");
  const [entregasTab, setEntregasTab] = useState<string>("hoje");
  
  // Usar o hook de sincronização para acesso à função de recarga
  const { recarregarDados } = useExpedicaoSync();
  
  // Garantir que ao trocar de aba os dados estejam atualizados
  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);
    recarregarDados(); // Recarrega os dados ao trocar de aba
  };
  
  const handleEntregasTabChange = (newValue: string) => {
    setEntregasTab(newValue);
    recarregarDados(); // Recarrega os dados ao trocar sub-abas
  };
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Expedição" 
        description="Gerenciamento de separação de pedidos e despacho de entregas" 
      />
      
      <Tabs defaultValue="separacao" value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="separacao">Separação de Pedidos</TabsTrigger>
          <TabsTrigger value="despacho">Despacho de Pedidos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Entregas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="separacao" className="space-y-4">
          <SeparacaoPedidos />
        </TabsContent>
        
        <TabsContent value="despacho" className="space-y-4">
          <Tabs defaultValue="hoje" value={entregasTab} onValueChange={handleEntregasTabChange} className="space-y-4">
            <TabsList className="w-full border-b">
              <TabsTrigger value="hoje" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700">
                🟢 Entregas de Hoje
              </TabsTrigger>
              <TabsTrigger value="atrasadas" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-700">
                🟡 Entregas Atrasadas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hoje">
              <Despacho tipoFiltro="hoje" />
            </TabsContent>
            
            <TabsContent value="atrasadas">
              <Despacho tipoFiltro="atrasadas" />
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4">
          <HistoricoEntregas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
