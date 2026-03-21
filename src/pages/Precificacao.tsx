
import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import InsumosSupabaseTab from "@/components/precificacao/InsumosSupabaseTab";
import ReceitasTab from "@/components/precificacao/ReceitasTab";
import ProdutosTab from "@/components/precificacao/ProdutosTab";
import RendimentoReceitasProdutos from "@/components/precificacao/RendimentoReceitasProdutos";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useRoutePermission } from "@/hooks/useRolePermissions";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";

export default function Precificacao() {
  const { activeTab, changeTab } = useTabPersistence("insumos");
  const { canEdit } = useRoutePermission('/precificacao');
  
  return (
    <EditPermissionProvider value={{ canEdit }}>
      <PageHeader 
        title="Precificação"
        description="Sistema integrado de gestão de insumos, receitas e produtos com banco de dados unificado"
      />
      
      <div className="mt-8">
        <Tabs value={activeTab} onValueChange={changeTab}>
          {/* Mobile: grid 2 colunas */}
          <div className="grid grid-cols-2 gap-2 lg:hidden mb-8">
            {[
              { id: "insumos", label: "Insumos" },
              { id: "receitas", label: "Receitas Base" },
              { id: "produtos", label: "Produtos" },
              { id: "rendimentos", label: "Rendimentos" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => changeTab(tab.id)}
                className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Desktop */}
          <TabsList className="hidden lg:grid grid-cols-4 mb-8">
            <TabsTrigger value="insumos">Insumos</TabsTrigger>
            <TabsTrigger value="receitas">Receitas Base</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
            <TabsTrigger value="rendimentos">Rendimentos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="insumos">
            <InsumosSupabaseTab />
          </TabsContent>
          
          <TabsContent value="receitas">
            <ReceitasTab />
          </TabsContent>
          
          <TabsContent value="produtos">
            <ProdutosTab />
          </TabsContent>
          
          <TabsContent value="rendimentos">
            <RendimentoReceitasProdutos />
          </TabsContent>
        </Tabs>
      </div>
    </EditPermissionProvider>
  );
}
