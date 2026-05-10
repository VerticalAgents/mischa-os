
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, ClipboardCheck } from "lucide-react";
import NecessidadeInsumosTab from "./NecessidadeInsumosTab";
import AuditoriaEstoqueTab from "./AuditoriaEstoqueTab";

export default function PedidosTab() {
  const [activeTab, setActiveTab] = useState("necessidade");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="necessidade" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Lista de Compras
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Contagem de Estoque
          </TabsTrigger>
        </TabsList>

        <TabsContent value="necessidade">
          <NecessidadeInsumosTab />
        </TabsContent>

        <TabsContent value="pedidos">
          <AuditoriaEstoqueTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
