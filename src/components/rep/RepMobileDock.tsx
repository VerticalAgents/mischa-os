import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, Calendar, BarChart3, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import RepMobileMenuSheet from "@/components/rep/RepMobileMenuSheet";

const dockItems = [
  { to: "/rep/home", label: "Início", Icon: Home },
  { to: "/rep/agendamentos", label: "Agenda", Icon: Calendar },
  { to: "/rep/estatisticas", label: "Stats", Icon: BarChart3 },
  { to: "/rep/clientes", label: "Clientes", Icon: Users },
];

export default function RepMobileDock() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 px-3 lg:hidden"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-stretch justify-around gap-1 rounded-3xl border border-border/60 bg-background/80 px-2 py-2 shadow-[0_8px_30px_hsl(var(--foreground)/0.15)] backdrop-blur-2xl">
          {dockItems.map(({ to, label, Icon }) => {
            const isActive = pathname === to || pathname.startsWith(to + "/");
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors",
                  isActive
                    ? "bg-muted text-foreground dark:bg-muted/70"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate text-[10px] font-medium uppercase tracking-wide">
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Mais opções"
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors",
              menuOpen ? "bg-muted text-foreground dark:bg-muted/70" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Mais</span>
          </button>
        </div>
      </nav>

      <RepMobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
