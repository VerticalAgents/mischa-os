
import { ReactNode, useState, useEffect } from "react";
import { useThemeStore } from "@/lib/theme";
import MobileHeader from "@/components/layout/MobileHeader";
import { SessionNavBar } from "@/components/ui/sidebar-next";
import TopHeader from "@/components/layout/TopHeader";
import { RouteStateManager } from "@/components/common/RouteStateManager";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark } = useThemeStore();

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
      <RouteStateManager />
      
      {/* Unified red sidebar — desktop: hover, mobile: hamburger toggle */}
      <SessionNavBar 
        mobileOpen={isMobileMenuOpen} 
        onMobileClose={() => setIsMobileMenuOpen(false)} 
      />

      {/* Mobile Header with hamburger */}
      <MobileHeader 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {/* Header superior com avatar e toggle de tema */}
      <TopHeader />

      {/* Main Content — no left margin on mobile (sidebar hidden), margin on desktop */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0 lg:ml-[3.05rem] transition-all">
        <div className="container py-4 lg:py-6 px-3 lg:px-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
