import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RepSidebar } from "@/components/rep/RepSidebar";
import logo from "@/assets/mischas-logo.png";

interface RepLayoutProps {
  children: ReactNode;
}

export default function RepLayout({ children }: RepLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Fechar drawer ao navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <RepSidebar />

      {/* Header mobile/tablet com hamburger */}
      <div
        className="fixed top-0 left-0 right-0 h-14 border-b px-4 flex items-center justify-between lg:hidden z-50"
        style={{ backgroundColor: "#d1193a", borderColor: "rgba(255,255,255,0.2)" }}
      >
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/rep/home" className="flex items-center space-x-2">
            <img
              src={logo}
              alt="Mischa's Bakery Logo"
              className="h-8 w-8 rounded-full border-2 border-white object-cover"
            />
            <span className="font-bold text-white">MISCHA'S BAKERY</span>
          </Link>
        </div>
      </div>

      {/* Drawer mobile */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full z-50 lg:hidden">
            <RepSidebar variant="mobile" onNavClick={() => setIsMobileMenuOpen(false)} />
          </div>
        </>
      )}

      <main className="flex-1 overflow-x-hidden pt-14 lg:pt-0">
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}