
import { ReactNode, useState } from "react";
import { Sidebar, SidebarBody } from "@/components/ui/sidebar-animated";
import SidebarContent from "@/components/layout/SidebarContent";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileMenuOverlay from "@/components/layout/MobileMenuOverlay";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate>
        <SidebarBody className="flex flex-col">
          <SidebarContent />
        </SidebarBody>
      </Sidebar>

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

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="container py-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
