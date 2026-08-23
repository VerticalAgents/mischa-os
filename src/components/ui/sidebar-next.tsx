import React, { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { create } from "zustand";
import { Badge } from "@/components/ui/badge";
import { Bell, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { menuGroups } from "@/components/layout/navigation-items";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";
import mischasLogo from "@/assets/mischas-logo.png";

/**
 * Navegação principal — seções 6 e 7 do DESIGN.md do Unno.
 *
 * Dois estados, e a regra que os une: recolher o menu NÃO esconde para onde ir,
 * muda a orientação. A coluna vira tira horizontal no cabeçalho e a tela ganha
 * 240px de largura de volta — numa tabela larga, é a diferença entre ler e rolar.
 *
 * A marca: o Unno usa bg-card claro no bloco; aqui o bloco é vermelho (#d1193a),
 * a identidade da Mischa's. A estrutura é a do documento; a tinta é da casa.
 */

const VERMELHO = "#d1193a";
const BORDA_INTERNA = "rgba(255,255,255,0.15)";
const CHAVE_ESTADO = "sidebar_expandido";

type EstadoSidebar = { expandido: boolean; alternar: () => void };

export const useSidebarStore = create<EstadoSidebar>((set) => ({
  expandido: (() => {
    try {
      return localStorage.getItem(CHAVE_ESTADO) !== "false";
    } catch {
      return true;
    }
  })(),
  alternar: () =>
    set((s) => {
      const proximo = !s.expandido;
      try {
        localStorage.setItem(CHAVE_ESTADO, String(proximo));
      } catch {
        /* modo privado do Safari */
      }
      return { expandido: proximo };
    }),
}));

function itemMatchesRoute(itemPath: string, routeKey: string): boolean {
  if (itemPath === routeKey) return true;
  return itemPath.split("?")[0] === routeKey;
}

/** Rótulo de interface: maiúscula espaçada. Conteúdo vai em caixa normal. */
const ROTULO = "text-[0.7rem] font-semibold uppercase tracking-[1px]";

/** Item aceso: branco a 18% + luz interna no topo — o mesmo relevo do cartão. */
const classeLinha = (aceso: boolean) =>
  cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-controle transition-all duration-200 ease-out-expo",
    ROTULO,
    aceso
      ? "bg-white/[.18] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      : "text-white/70 hover:bg-white/10 hover:text-white"
  );

function useMenuFiltrado() {
  const { userRole } = useUserRoles();
  const { allowedRoutes } = useMyPermissions();
  return useMemo(() => {
    if (userRole === "admin") return menuGroups;
    return menuGroups
      .filter((g) => g.variant !== "admin")
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => allowedRoutes.some((r) => itemMatchesRoute(it.path, r))),
      }))
      .filter((g) => g.items.length > 0);
  }, [userRole, allowedRoutes]);
}

function useAlertas() {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    const atualizar = () => setTotal(useAlertaStore.getState().getQuantidadeAlertasNaoLidas());
    atualizar();
    return useAlertaStore.subscribe(atualizar);
  }, []);
  return total;
}

interface SessionNavBarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SessionNavBar({ mobileOpen = false, onMobileClose }: SessionNavBarProps) {
  const { pathname } = useLocation();
  const grupos = useMenuFiltrado();
  const alertas = useAlertas();
  const expandido = useSidebarStore((s) => s.expandido);
  const alternar = useSidebarStore((s) => s.alternar);

  const grupoDaRota = grupos.find((g) =>
    g.items.some((it) => it.path.split("?")[0] === pathname)
  )?.variant;

  // O grupo da rota atual nasce aberto; os outros, fechados. Depois disso a escolha
  // é de quem clica — não reabrir nada ao navegar, senão um grupo fechado de
  // propósito volta sozinho a cada página.
  const [abertos, setAbertos] = useState<string[]>(() => (grupoDaRota ? [grupoDaRota] : []));
  const jaAbriu = useRef(false);
  useEffect(() => {
    if (!jaAbriu.current && grupoDaRota) {
      setAbertos([grupoDaRota]);
      jaAbriu.current = true;
    }
  }, [grupoDaRota]);

  const alternarGrupo = (v: string) =>
    setAbertos((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));

  const corpo = (aoNavegar?: () => void) => (
    <>
      <div
        className="flex items-center gap-3 px-5 py-5 border-b shrink-0"
        style={{ borderColor: BORDA_INTERNA }}
      >
        <img
          src={mischasLogo}
          alt="Mischa's Bakery"
          className="size-9 shrink-0 rounded-full border-2 border-white object-cover"
        />
        <div className="min-w-0">
          <p className="font-display text-[0.8rem] font-extrabold uppercase tracking-[3px] text-white truncate">
            Mischa's
          </p>
          <p className="text-[0.65rem] uppercase tracking-[1.5px] text-white/60 truncate">
            Bakery
          </p>
        </div>
        {/* Recolher: fica no cabeçalho do bloco, onde se procura por ele. */}
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
        {grupos.map((grupo) => {
          const aberto = abertos.includes(grupo.variant);
          const temFilhoAtivo = grupo.items.some((it) => it.path.split("?")[0] === pathname);

          if (grupo.items.length === 1) {
            const item = grupo.items[0];
            const aceso = item.path.split("?")[0] === pathname;
            return (
              <Link
                key={grupo.variant}
                to={item.path}
                onClick={aoNavegar}
                className={classeLinha(aceso)}
              >
                <span className={aceso ? "text-white" : "text-white/60"}>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={grupo.variant}>
              <button
                type="button"
                onClick={() => alternarGrupo(grupo.variant)}
                className={cn(classeLinha(false), "w-full justify-between")}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="truncate">{grupo.title}</span>
                  {!aberto && temFilhoAtivo && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform duration-200",
                    aberto && "rotate-180"
                  )}
                />
              </button>

              {aberto && (
                <div
                  className="ml-4 pl-3 mt-1 space-y-1 border-l"
                  style={{ borderColor: BORDA_INTERNA }}
                >
                  {grupo.items.map((item) => {
                    const aceso = item.path.split("?")[0] === pathname;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={aoNavegar}
                        className={classeLinha(aceso)}
                      >
                        <span className={aceso ? "text-white" : "text-white/60"}>{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div
        className="shrink-0 border-t p-3 flex items-center gap-2"
        style={{ borderColor: BORDA_INTERNA }}
      >
        <Link to="/alertas" onClick={aoNavegar} className={cn(classeLinha(false), "flex-1")}>
          <span className="relative text-white/60">
            <Bell className="h-4 w-4" />
            {alertas > 0 && (
              <Badge
                className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold"
                style={{ color: VERMELHO }}
              >
                {alertas}
              </Badge>
            )}
          </span>
          <span className="truncate">Alertas</span>
        </Link>
      </div>
    </>
  );

  return (
    <>
      {expandido && (
        <aside
          className="fixed left-3 top-3 bottom-3 z-40 hidden w-60 lg:flex flex-col overflow-hidden rounded-bloco border shadow-bloco"
          style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
        >
          {corpo()}
        </aside>
      )}

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
            />
            <motion.div
              className="fixed left-3 top-3 bottom-3 z-50 flex w-64 flex-col overflow-hidden rounded-bloco border shadow-bloco lg:hidden"
              style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.26 }}
            >
              {corpo(onMobileClose)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * Cabeçalho — a mesma cápsula do menu, deitada. Só é renderizado com o menu
 * recolhido: com a coluna aberta, uma barra vazia rouba altura para não dizer nada.
 * Não rola para o lado e nunca quebra em duas linhas (seção 7).
 */
export function TopNavBar() {
  const { pathname } = useLocation();
  const grupos = useMenuFiltrado();
  const alertas = useAlertas();
  const expandido = useSidebarStore((s) => s.expandido);
  const alternar = useSidebarStore((s) => s.alternar);
  const [aberto, setAberto] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const timerFechar = useRef<number | null>(null);

  // Abre ao passar o mouse. O atraso de 120ms no fechar dá tempo de atravessar
  // o vão entre o botão e o painel sem ele sumir no meio do caminho.
  const cancelarFechar = () => {
    if (timerFechar.current) {
      window.clearTimeout(timerFechar.current);
      timerFechar.current = null;
    }
  };
  const agendarFechar = () => {
    cancelarFechar();
    timerFechar.current = window.setTimeout(() => setAberto(null), 120);
  };

  useEffect(() => () => cancelarFechar(), []);
  useEffect(() => setAberto(null), [pathname]);
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(null);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  if (expandido) return null;

  return (
    <div ref={ref} className="fixed left-0 right-0 top-0 z-40 hidden px-3 pt-3 lg:block">
      {/* pr-24: o avatar e o botão de tema são fixos no canto superior direito;
          sem a folga eles cairiam por cima do sino de alertas. */}
      <div
        className="flex h-14 items-center gap-1 rounded-bloco border pl-2.5 pr-24 shadow-bloco"
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
          src={mischasLogo}
          alt="Mischa's Bakery"
          className="size-8 shrink-0 rounded-full border-2 border-white object-cover mr-1"
        />

        <nav className="flex min-w-0 flex-1 items-center gap-1">
          {grupos.map((grupo) => {
            const temFilhoAtivo = grupo.items.some((it) => it.path.split("?")[0] === pathname);

            if (grupo.items.length === 1) {
              const item = grupo.items[0];
              return (
                <Link
                  key={grupo.variant}
                  to={item.path}
                  className={cn(classeLinha(temFilhoAtivo), "py-2 whitespace-nowrap")}
                >
                  <span className={temFilhoAtivo ? "text-white" : "text-white/60"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            }

            return (
              <div
                key={grupo.variant}
                className="relative"
                onMouseEnter={() => {
                  cancelarFechar();
                  setAberto(grupo.variant);
                }}
                onMouseLeave={agendarFechar}
              >
                <button
                  type="button"
                  onFocus={() => {
                    cancelarFechar();
                    setAberto(grupo.variant);
                  }}
                  onClick={() => setAberto((a) => (a === grupo.variant ? null : grupo.variant))}
                  className={cn(
                    classeLinha(temFilhoAtivo || aberto === grupo.variant),
                    "py-2 whitespace-nowrap"
                  )}
                >
                  <span>{grupo.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform duration-200",
                      aberto === grupo.variant && "rotate-180"
                    )}
                  />
                </button>

                {aberto === grupo.variant && (
                  <div className="absolute left-0 top-full w-56 mt-2 rounded-bloco border border-border bg-popover p-1.5 text-popover-foreground shadow-bloco animate-in fade-in-0 slide-in-from-top-1 duration-150 before:absolute before:-top-2 before:left-0 before:h-2 before:w-full before:content-['']">
                    {grupo.items.map((item) => {
                      const aceso = item.path.split("?")[0] === pathname;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex items-center gap-2.5 rounded-controle px-3 py-2 text-sm transition-colors",
                            aceso
                              ? "bg-accent text-accent-foreground font-medium"
                              : "hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {item.icon}
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <Link
          to="/alertas"
          aria-label="Alertas"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-controle text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Bell className="h-[18px] w-[18px]" />
          {alertas > 0 && (
            <Badge
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold"
              style={{ color: VERMELHO }}
            >
              {alertas}
            </Badge>
          )}
        </Link>
      </div>
    </div>
  );
}
