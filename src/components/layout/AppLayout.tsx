
import { ReactNode, Suspense, useEffect } from "react";
import { useThemeStore } from "@/lib/theme";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileDock from "@/components/layout/MobileDock";
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
    <div className="min-h-screen flex w-full bg-ground">
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

      {/* Main Content — no left margin on mobile (sidebar hidden), margin on desktop */}
      <main className={`flex-1 overflow-auto pt-14 pb-20 lg:pb-0 transition-all duration-200 ease-out-expo ${
          sidebarExpandido ? "lg:pt-0 lg:ml-[calc(15rem+1.5rem)]" : "lg:pt-[4.25rem] lg:ml-0"
        }`}>
        <div className="container py-4 lg:py-6 px-3 lg:px-8 max-w-7xl mx-auto">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}
