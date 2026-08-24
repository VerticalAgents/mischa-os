import { NavLink, Link, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  LogOut,
  Settings,
  BarChart3,
  AlertTriangle,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarStore } from "@/lib/sidebar-store";
import logo from "@/assets/mischas-logo.png";

/**
 * Navegação do portal do representante — mesmo sistema visual do app completo
 * (seções 6 e 7 do DESIGN.md do Unno), com o vermelho da Mischa's no bloco.
 *
 * Dois estados, a mesma regra: recolher não esconde para onde ir, deita a
 * navegação no cabeçalho. O estado é compartilhado com o menu do app completo
 * (`@/lib/sidebar-store`) — a preferência de quem usa é uma só.
 *
 * O representante tem seis destinos, todos no mesmo nível: aqui não há grupos
 * que abrem, nem no bloco nem no cabeçalho.
 */

const VERMELHO = "#d1193a";
const BORDA_INTERNA = "rgba(255,255,255,0.15)";

/**
 * "Estatísticas" no lugar de "Estatísticas Comerciais": em maiúscula espaçada o
 * nome por extenso não cabia na largura do bloco e vinha cortado — e a palavra
 * que sumia era justamente a que o rótulo perdia sem dó.
 */
const items = [
  { to: "/rep/home", label: "Início", icon: Home },
  { to: "/rep/agendamentos", label: "Agendamentos", icon: Calendar },
  { to: "/rep/estatisticas", label: "Estatísticas", icon: BarChart3 },
  { to: "/rep/clientes", label: "Meus Clientes", icon: Users },
  { to: "/rep/inadimplencia", label: "Inadimplência", icon: AlertTriangle },
  { to: "/rep/configuracoes", label: "Configurações", icon: Settings },
];

/** Rótulo de interface: maiúscula espaçada. Conteúdo vai em caixa normal. */
const ROTULO = "text-[0.7rem] font-semibold uppercase tracking-[1px]";

/** Item aceso: branco a 18% + luz interna no topo — o mesmo relevo do cartão. */
const classeLinha = (aceso: boolean) =>
  cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-pilula transition-all duration-200 ease-out-expo",
    ROTULO,
    aceso
      ? "bg-white/[.18] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  );

const estaAceso = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(to + "/");

interface RepSidebarProps {
  variant?: "desktop" | "mobile";
  onNavClick?: () => void;
}

export function RepSidebar({ variant = "desktop", onNavClick }: RepSidebarProps = {}) {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();
  const expandido = useSidebarStore((s) => s.expandido);
  const alternar = useSidebarStore((s) => s.alternar);

  // No celular o bloco é o conteúdo da gaveta e aparece sempre; no computador,
  // só enquanto expandido — recolhido, quem navega é o cabeçalho.
  if (variant === "desktop" && !expandido) return null;

  const containerClass =
    variant === "mobile"
      ? "w-60 h-full flex flex-col overflow-hidden text-white"
      : "fixed left-3 top-3 bottom-3 z-40 hidden w-60 lg:flex flex-col overflow-hidden rounded-bloco border shadow-bloco";

  return (
    <aside
      className={containerClass}
      style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
    >
      <div
        className="flex items-center gap-3 px-5 py-5 border-b shrink-0"
        style={{ borderColor: BORDA_INTERNA }}
      >
        <img
          src={logo}
          alt="Mischa's Bakery"
          className="size-9 shrink-0 rounded-full border-2 border-white object-cover"
        />
        <div className="min-w-0">
          <p className="font-display text-[0.8rem] font-extrabold uppercase tracking-[3px] text-white truncate">
            Mischa's
          </p>
          <p className="text-[0.65rem] uppercase tracking-[1.5px] text-white/60 truncate">
            Representante
          </p>
        </div>
        {/* Recolher: no cabeçalho do bloco, onde se procura por ele. */}
        <button
          type="button"
          onClick={alternar}
          aria-label="Recolher menu"
          title="Recolher menu"
          className="ml-auto hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-controle bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
        >
          <ChevronsLeft className="h-[18px] w-[18px]" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-hide">
        {items.map((item) => {
          const Icon = item.icon;
          const aceso = estaAceso(pathname, item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onNavClick?.()}
              className={classeLinha(aceso)}
            >
              <Icon className={cn("h-4 w-4 shrink-0", aceso ? "text-white" : "text-white/60")} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 border-t p-3 space-y-1" style={{ borderColor: BORDA_INTERNA }}>
        {user?.email && (
          <div className="px-3 truncate text-[11px] text-white/60">{user.email}</div>
        )}
        <button
          onClick={() => {
            onNavClick?.();
            logout();
          }}
          className={cn(classeLinha(false), "w-full")}
        >
          <LogOut className="h-4 w-4 shrink-0 text-white/60" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}

/**
 * Cabeçalho — a mesma cápsula do bloco, deitada. Só existe com o menu recolhido:
 * com a coluna aberta, uma barra vazia rouba altura para não dizer nada.
 * Não rola para o lado e nunca quebra em duas linhas (seção 7).
 */
export function RepTopNavBar() {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const expandido = useSidebarStore((s) => s.expandido);
  const alternar = useSidebarStore((s) => s.alternar);

  if (expandido) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-40 hidden px-3 pt-3 lg:block">
      <div
        className="flex h-14 items-center gap-1 rounded-bloco border pl-2.5 pr-2.5 shadow-bloco"
        style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
      >
        <button
          type="button"
          onClick={alternar}
          aria-label="Expandir menu"
          title="Expandir menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-controle text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronsRight className="h-[18px] w-[18px]" />
        </button>

        <img
          src={logo}
          alt="Mischa's Bakery"
          className="size-8 shrink-0 rounded-full border-2 border-white object-cover mr-1"
        />

        <nav className="flex min-w-0 flex-1 items-center gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const aceso = estaAceso(pathname, item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                title={item.label}
                // px-2 abaixo de 1280px: com o espacamento cheio os seis itens
                // estouravam 16px numa tela de 1024 e "Configuracoes" vinha cortado.
                className={cn(classeLinha(aceso), "py-2 px-2 xl:px-3 whitespace-nowrap")}
              >
                <Icon className={cn("h-4 w-4 shrink-0", aceso ? "text-white" : "text-white/60")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={logout}
          aria-label="Sair"
          title="Sair"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-controle text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
