import { ReactNode, Suspense, useEffect, useMemo } from "react";
import { useThemeStore } from "@/lib/theme";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileDock from "@/components/layout/MobileDock";
import AreaGestos from "@/components/mobile/AreaGestos";
import { useItensBarraApp } from "@/components/mobile/itens-barra";
import { paginasBarraApp } from "@/components/mobile/paginas-barra";
import { SessionNavBar, TopNavBar, useSidebarStore } from "@/components/ui/sidebar-next";
import TopHeader from "@/components/layout/TopHeader";
import { RouteStateManager } from "@/components/common/RouteStateManager";
import PageSkeleton from "@/components/layout/PageSkeleton";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { isDark } = useThemeStore();
  const sidebarExpandido = useSidebarStore((s) => s.expandido);
  const itensBarra = useItensBarraApp();

  // A área de gestos compara esta lista a cada toque; um array novo por render
  // religaria os ouvintes de toque sem parar.
  const rotasBarra = useMemo(() => itensBarra.map((i) => i.path), [itensBarra]);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.add('dark');
      htmlElement.style.colorScheme = 'dark';
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.style.colorScheme = 'light';
    }
  }, [isDark]);

  return (
    <div className="min-h-screen min-h-[100dvh] flex w-full bg-ground">
      <RouteStateManager />

      {/* Menu lateral (expandido) e cabeçalho-cápsula (recolhido) — a navegação
          troca de orientação em vez de desaparecer. */}
      <SessionNavBar />
      <TopNavBar />

      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile bottom dock + sheet menu */}
      <MobileDock />

      {/* Header superior com avatar e toggle de tema */}
      <TopHeader />

      {/* As folgas do celular vêm das classes de apoio (index.css), que carregam
          o env() da faixa do gesto de home — no computador elas não valem. */}
      <main className={`flex-1 overflow-auto espaco-cabecalho-flutuante espaco-barra-flutuante transition-all duration-200 ease-out-expo ${
          sidebarExpandido ? "lg:pt-0 lg:ml-[calc(15rem+1.5rem)]" : "lg:pt-[4.25rem] lg:ml-0"
        }`}>
        <div className="container py-4 lg:py-6 px-3 lg:px-8 max-w-7xl mx-auto">
          <AreaGestos
            rotas={rotasBarra}
            paginas={paginasBarraApp}
            classeConteudo="px-3 py-4 max-w-7xl mx-auto"
          >
            <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
          </AreaGestos>
        </div>
      </main>
    </div>
  );
}
