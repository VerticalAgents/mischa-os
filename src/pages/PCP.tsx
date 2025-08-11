import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PCPHeader from "@/components/pcp/PCPHeader";
import ProjecaoProducaoTab from "@/components/pcp/ProjecaoProducaoTab";
import NecessidadeDiariaTab from "@/components/pcp/NecessidadeDiariaTab";
import ProducaoAgendadaTab from "@/components/pcp/ProducaoAgendadaTab";
import HistoricoProducao from "@/components/pcp/HistoricoProducao";
import AuditoriaPCPTab from "@/components/pcp/AuditoriaPCPTab";
import { useTabPersistence } from "@/hooks/useTabPersistence";

export default function PCP() {
  const { activeTab, changeTab } = useTabPersistence("projecao-producao");

  return (
    <>
      <PCPHeader />
      
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={changeTab}>
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="projecao-producao">Projeção</TabsTrigger>
            <TabsTrigger value="necessidade-diaria">Necessidade</TabsTrigger>
            <TabsTrigger value="producao-agendada">Produção</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
            <TabsTrigger value="auditoria-pcp">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="projecao-producao" className="space-y-6 mt-6" forceMount>
            <ProjecaoProducaoTab />
          </TabsContent>

          <TabsContent value="necessidade-diaria" className="space-y-6 mt-6" forceMount>
            <NecessidadeDiariaTab />
          </TabsContent>

          <TabsContent value="producao-agendada" className="space-y-6 mt-6" forceMount>
            <ProducaoAgendadaTab />
          </TabsContent>

          <TabsContent value="historico" className="space-y-6 mt-6" forceMount>
            <HistoricoProducao />
          </TabsContent>

          <TabsContent value="auditoria-pcp" className="space-y-6 mt-6" forceMount>
            <AuditoriaPCPTab />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
