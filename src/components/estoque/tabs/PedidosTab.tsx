
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Calculator } from "lucide-react";
import NecessidadeInsumosTab from "./NecessidadeInsumosTab";

export default function PedidosTab() {
  const [activeTab, setActiveTab] = useState("necessidade");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="necessidade" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Necessidade de Insumos
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="flex items-center gap-2">
            <Construction className="h-4 w-4" />
            Pedidos de Compra
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="necessidade">
          <NecessidadeInsumosTab />
        </TabsContent>
        
        <TabsContent value="pedidos">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Construction className="h-6 w-6 text-orange-500" />
                  Em Desenvolvimento
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  🚧 Esta funcionalidade está em desenvolvimento.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Em breve você poderá gerenciar pedidos de compra aqui.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
