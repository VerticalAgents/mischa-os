import { ReactNode, useMemo } from "react";
import { Link } from "react-router-dom";
import { RepSidebar, RepTopNavBar } from "@/components/rep/RepSidebar";
import RepMobileDock from "@/components/rep/RepMobileDock";
import AreaGestos from "@/components/mobile/AreaGestos";
import { itensBarraRep } from "@/components/mobile/itens-barra";
import { paginasBarraRep } from "@/components/mobile/paginas-barra";
import { useSidebarStore } from "@/lib/sidebar-store";
import logo from "@/assets/mischas-logo.png";

const VERMELHO = "#d1193a";
const BORDA_INTERNA = "rgba(255,255,255,0.18)";

const rotasBarra = itensBarraRep.map((i) => i.path);

interface RepLayoutProps {
  children: ReactNode;
}

export default function RepLayout({ children }: RepLayoutProps) {
  const sidebarExpandido = useSidebarStore((s) => s.expandido);
  const rotas = useMemo(() => rotasBarra, []);

  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full bg-ground">
      {/* Menu lateral (expandido) e cabeçalho-cápsula (recolhido) — a navegação
          troca de orientação em vez de desaparecer. */}
      <RepSidebar />
      <RepTopNavBar />

      {/* Cabeçalho do celular: cápsula vermelha flutuante, mesma do app completo. */}
      <div className="fixed inset-x-0 top-0 z-50 px-3 pt-2 lg:hidden">
        <div
          className="flex h-11 items-center gap-2 rounded-bloco border pl-2 pr-1.5 shadow-bloco"
          style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
        >
          <Link to="/rep/home" className="flex min-w-0 items-center gap-2">
            <img
              src={logo}
              alt="Mischa's Bakery"
              className="size-7 shrink-0 rounded-full border-2 border-white object-cover"
            />
            <span className="truncate text-[0.65rem] font-extrabold uppercase tracking-[2px] text-white">
              Mischa's Bakery
            </span>
          </Link>
        </div>
      </div>

      {/* Dock inferior + bottom sheet mobile */}
      <RepMobileDock />

      <main
        className={`flex-1 overflow-auto espaco-cabecalho-flutuante espaco-barra-flutuante transition-all duration-200 ease-out-expo ${
          sidebarExpandido ? "lg:pt-0 lg:ml-[calc(15rem+1.5rem)]" : "lg:pt-[4.25rem] lg:ml-0"
        }`}
      >
        <div className="p-4 lg:p-6 max-w-6xl mx-auto">
          <AreaGestos
            rotas={rotas}
            paginas={paginasBarraRep}
            classeConteudo="p-4 max-w-6xl mx-auto"
          >
            {children}
          </AreaGestos>
        </div>
      </main>
    </div>
  );
}
