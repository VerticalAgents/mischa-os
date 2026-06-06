import { useEffect, lazy, Suspense } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ResumoExpedicao from "@/components/expedicao/ResumoExpedicao";
import SeparacaoPedidos from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";
import { HistoricoEntregas } from "@/components/expedicao/HistoricoEntregas";
import { RotaEntrega } from "@/components/expedicao/RotaEntrega";
import DashboardEntregasAnalytics from "@/components/expedicao/DashboardEntregasAnalytics";
import { OrganizacaoEntregas } from "@/components/expedicao/organizacao/OrganizacaoEntregas";
import { useExpedicaoSync } from "@/hooks/useExpedicaoSync";
import { useRoutePermission } from "@/hooks/useRolePermissions";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";

const GestaoClickTab = lazy(() => import("@/components/expedicao/GestaoClickTab"));
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
  const {
    recarregarDados
  } = useExpedicaoSync();

  // Sincronizar com URL ao montar (apenas reagir a mudanças na URL)
  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabFromUrl]);

  useEffect(() => {
    if (entregasTabFromUrl && entregasTabFromUrl !== entregasTab) {
      setEntregasTab(entregasTabFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entregasTabFromUrl]);

  // Garantir que ao trocar de aba os dados estejam atualizados
  const handleTabChange = (newValue: string) => {
    setActiveTab(newValue);

    // Atualizar URL sem reload preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', newValue);
      return newParams;
    }, { replace: true });
  };

  const handleEntregasTabChange = (newValue: string) => {
    setEntregasTab(newValue);

    // Atualizar URL sem reload preservando outros parâmetros
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('entregas', newValue);
      return newParams;
    }, { replace: true });
  };

  const { canEdit } = useRoutePermission('/expedicao');

  return (
    <EditPermissionProvider value={{ canEdit }}>
      <div className="space-y-6">
        <PageHeader 
          title="Expedição" 
          description="Gerenciamento de separação de pedidos e despacho de entregas"
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          {/* Mobile: grid 2 colunas */}
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            {[
              { id: "resumo", label: "Dashboard" },
              { id: "separacao", label: "Separação" },
              { id: "gestaoclick", label: "Documentos" },
              { id: "despacho", label: "Despacho" },
              { id: "organizacao", label: "Organização" },
              { id: "rota", label: "Rota" },
              { id: "dashboard", label: "Histórico" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
          {/* Desktop: TabsList horizontal */}
          <TabsList className="hidden lg:inline-flex">
            <TabsTrigger value="resumo">Dashboard</TabsTrigger>
            <TabsTrigger value="separacao">Separação</TabsTrigger>
            <TabsTrigger value="gestaoclick">Documentos</TabsTrigger>
            <TabsTrigger value="despacho">Despacho</TabsTrigger>
            <TabsTrigger value="organizacao">Organização</TabsTrigger>
            <TabsTrigger value="rota">Rota</TabsTrigger>
            <TabsTrigger value="dashboard">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="space-y-4" forceMount={activeTab === "resumo" ? true : undefined}>
            {activeTab === "resumo" && <ResumoExpedicao />}
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-4" forceMount={activeTab === "dashboard" ? true : undefined}>
            {activeTab === "dashboard" && (
              <>
                <DashboardEntregasAnalytics />
                <div className="pt-6">
                  <HistoricoEntregas />
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="separacao" className="space-y-4" forceMount={activeTab === "separacao" ? true : undefined}>
            {activeTab === "separacao" && <SeparacaoPedidos />}
          </TabsContent>

          <TabsContent value="gestaoclick" className="space-y-4" forceMount={activeTab === "gestaoclick" ? true : undefined}>
            {activeTab === "gestaoclick" && (
              <Suspense fallback={<div className="h-64 bg-muted/50 rounded-lg animate-pulse" />}>
                <GestaoClickTab />
              </Suspense>
            )}
          </TabsContent>
          
          <TabsContent value="despacho" className="space-y-4" forceMount={activeTab === "despacho" ? true : undefined}>
            {activeTab === "despacho" && <Despacho />}
          </TabsContent>

          <TabsContent value="organizacao" className="space-y-4" forceMount={activeTab === "organizacao" ? true : undefined}>
            {activeTab === "organizacao" && <OrganizacaoEntregas />}
          </TabsContent>
          
          <TabsContent value="rota" className="space-y-4" forceMount={activeTab === "rota" ? true : undefined}>
            {activeTab === "rota" && <RotaEntrega />}
          </TabsContent>
        </Tabs>
      </div>
    </EditPermissionProvider>
  );
}
