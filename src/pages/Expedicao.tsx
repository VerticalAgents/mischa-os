
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeparacaoPedidos } from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";
import { HistoricoEntregas } from "@/components/expedicao/HistoricoEntregas";
import { format, isToday, isTomorrow, isYesterday, addBusinessDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to get the next business day
const getProximoDiaUtil = (data: Date): Date => {
  const proximaData = addBusinessDays(new Date(data), 1);
  return isWeekend(proximaData) ? getProximoDiaUtil(proximaData) : proximaData;
};

export default function Expedicao() {
  const [activeTab, setActiveTab] = useState<string>("separacao");
  const [entregasTab, setEntregasTab] = useState<string>("hoje");
  
  // Get today's date with time set to beginning of day for comparison
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Calculate next business day
  const proximoDiaUtil = getProximoDiaUtil(hoje);
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Expedição" 
        description="Gerenciamento de separação de pedidos e despacho de entregas" 
      />
      
      <Tabs defaultValue="separacao" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="separacao">Separação de Pedidos</TabsTrigger>
          <TabsTrigger value="despacho">Despacho de Pedidos</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Entregas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="separacao" className="space-y-4">
          <SeparacaoPedidos />
        </TabsContent>
        
        <TabsContent value="despacho" className="space-y-4">
          <Tabs defaultValue="hoje" value={entregasTab} onValueChange={setEntregasTab} className="space-y-4">
            <TabsList className="w-full border-b">
              <TabsTrigger value="hoje" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700">
                🟢 Entregas de Hoje
              </TabsTrigger>
              <TabsTrigger value="atrasadas" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-700">
                🟡 Entregas Atrasadas (Ontem)
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
