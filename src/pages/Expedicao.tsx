
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeparacaoPedidos } from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";

export default function Expedicao() {
  const [activeTab, setActiveTab] = useState<string>("separacao");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expedição"
        description="Gerenciamento de separação de pedidos e despacho de entregas"
      />
      
      <Tabs 
        defaultValue="separacao" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="separacao">Separação de Pedidos</TabsTrigger>
          <TabsTrigger value="despacho">Despacho</TabsTrigger>
        </TabsList>
        
        <TabsContent value="separacao" className="space-y-4">
          <SeparacaoPedidos />
        </TabsContent>
        
        <TabsContent value="despacho" className="space-y-4">
          <Despacho />
        </TabsContent>
      </Tabs>
    </div>
  );
}
