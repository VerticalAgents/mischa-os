import { useEffect, lazy, Suspense } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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

  /*
   * A barra de abas como BLOCO. O padrao do componente e `bg-muted`, que aqui e
   * exatamente a cor do chao da aplicacao (--app-ground = --muted): a barra
   * sumia no fundo e so a aba ativa aparecia. Como bloco — bg-card, borda,
   * sombra — ela volta a existir, e as abas viram controles dentro dela.
   *
   * A aba acesa usa a marca a 12% + luz interna no topo, a MESMA marcacao do
   * item aceso no menu lateral e da pilula da barra inferior. Um jeito so de
   * dizer "voce esta aqui" no app inteiro.
   */
  const classeAba = (aceso: boolean) =>
    cn(
      "rounded-controle px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[1px]",
      "transition-all duration-200 ease-out-expo",
      aceso
        ? "bg-brand-500/[.12] text-brand-700 shadow-[inset_0_1px_0_#ffffffb3] dark:text-brand-400 dark:shadow-[inset_0_1px_0_#ffffff0f]"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    );

  const ABAS = [
    { id: "resumo", label: "Dashboard" },
    { id: "separacao", label: "Separação" },
    { id: "gestaoclick", label: "Documentos" },
    { id: "despacho", label: "Despacho" },
    { id: "organizacao", label: "Organização" },
    { id: "rota", label: "Rota" },
    { id: "dashboard", label: "Histórico" },
  ];

  return (
    <EditPermissionProvider value={{ canEdit }}>
      <div className="space-y-6">
        <PageHeader 
          title="Expedição" 
          description="Gerenciamento de separação de pedidos e despacho de entregas"
        />
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          {/* Celular: grade de 2 colunas dentro do mesmo bloco */}
          <div className="grid grid-cols-2 gap-1.5 rounded-bloco border border-border bg-card p-1.5 shadow-tema lg:hidden">
            {ABAS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(classeAba(activeTab === tab.id), "min-h-[44px]")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Computador: tira horizontal */}
          <TabsList className="hidden h-auto rounded-bloco border border-border bg-card p-1.5 shadow-tema lg:inline-flex">
            {ABAS.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                /* Aqui a marcacao vem do data-state do proprio Radix, e nao do
                   classeAba: o componente ja traz um data-[state=active]:bg-* e,
                   como as duas regras tem a mesma forca, a ultima da folha
                   vencia — a pilula existia no HTML e nao pintava. */
                className={cn(
                  "rounded-controle px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[1px]",
                  "transition-all duration-200 ease-out-expo",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  "data-[state=active]:bg-brand-500/[.12] data-[state=active]:text-brand-700",
                  "data-[state=active]:shadow-[inset_0_1px_0_#ffffffb3]",
                  "dark:data-[state=active]:text-brand-400",
                  "dark:data-[state=active]:shadow-[inset_0_1px_0_#ffffff0f]"
                )}
              >
                {tab.label}
              </TabsTrigger>
            ))}
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
