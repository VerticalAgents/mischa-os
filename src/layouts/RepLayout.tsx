import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { RepSidebar, RepTopNavBar } from "@/components/rep/RepSidebar";
import RepMobileDock from "@/components/rep/RepMobileDock";
import { useSidebarStore } from "@/lib/sidebar-store";
import logo from "@/assets/mischas-logo.png";

interface RepLayoutProps {
  children: ReactNode;
}

export default function RepLayout({ children }: RepLayoutProps) {
  const sidebarExpandido = useSidebarStore((s) => s.expandido);

  return (
    <div className="flex min-h-screen w-full bg-ground">
      {/* Menu lateral (expandido) e cabeçalho-cápsula (recolhido) — a navegação
          troca de orientação em vez de desaparecer. */}
      <RepSidebar />
      <RepTopNavBar />

      {/* Header mobile/tablet */}
      <div
        className="fixed top-0 left-0 right-0 h-14 border-b px-4 flex items-center justify-between lg:hidden z-50"
        style={{ backgroundColor: "#d1193a", borderColor: "rgba(255,255,255,0.2)" }}
      >
        <div className="flex items-center space-x-2">
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

      {/* Dock inferior + bottom sheet mobile */}
      <RepMobileDock />

      <main
        className={`flex-1 overflow-x-hidden pt-14 pb-20 lg:pb-0 transition-all duration-200 ease-out-expo ${
          sidebarExpandido ? "lg:pt-0 lg:ml-[calc(15rem+1.5rem)]" : "lg:pt-[4.25rem] lg:ml-0"
        }`}
      >
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
