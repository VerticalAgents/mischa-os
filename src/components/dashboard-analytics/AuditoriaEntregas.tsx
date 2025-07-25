
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuditoriaEntregasClientes from "./AuditoriaEntregasClientes";
import AuditoriaEntregasHistorico from "./AuditoriaEntregasHistorico";

interface AuditoriaEntregasProps {
  dataInicio: string;
  dataFim: string;
}

export default function AuditoriaEntregas({ dataInicio, dataFim }: AuditoriaEntregasProps) {
  const [activeTab, setActiveTab] = useState("clientes");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoria de Entregas</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clientes">Configuração de Clientes</TabsTrigger>
            <TabsTrigger value="historico">Histórico de Entregas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clientes" className="mt-6">
            <AuditoriaEntregasClientes dataInicio={dataInicio} dataFim={dataFim} />
          </TabsContent>
          
          <TabsContent value="historico" className="mt-6">
            <AuditoriaEntregasHistorico dataInicio={dataInicio} dataFim={dataFim} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
