import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { RepSidebar } from "@/components/rep/RepSidebar";
import RepMobileDock from "@/components/rep/RepMobileDock";
import logo from "@/assets/mischas-logo.png";

interface RepLayoutProps {
  children: ReactNode;
}

export default function RepLayout({ children }: RepLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <RepSidebar />

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

      <main className="flex-1 overflow-x-hidden pt-14 pb-20 lg:pt-0 lg:pb-0">
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}