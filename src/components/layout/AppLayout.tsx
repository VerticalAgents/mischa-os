
import { ReactNode, useState, useEffect } from "react";
import { useThemeStore } from "@/lib/theme";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileMenuOverlay from "@/components/layout/MobileMenuOverlay";
import { SessionNavBar } from "@/components/ui/sidebar-next";
import TopHeader from "@/components/layout/TopHeader";
import { RouteStateManager } from "@/components/common/RouteStateManager";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark } = useThemeStore();

  // Apply theme when the isDark state changes
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
    <div className="min-h-screen flex w-full bg-background">
      {/* Gerenciador de estado de rotas */}
      <RouteStateManager />
      
      {/* Nova sidebar com animações fluidas */}
      <SessionNavBar />

      {/* Mobile Header */}
      <MobileHeader 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <MobileMenuOverlay 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      )}
      
      {/* Header superior com avatar e toggle de tema */}
      <TopHeader />

      {/* Main Content - adjusts automatically with the sidebar */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 ml-[3.05rem] transition-all">
        <div className="container py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
