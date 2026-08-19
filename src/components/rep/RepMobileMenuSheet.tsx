import { Link, useLocation } from "react-router-dom";
import { Home, Users, Calendar, BarChart3, Settings, LogOut, X, AlertTriangle } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

export const repMenuItems = [
  { to: "/rep/home", label: "Início", Icon: Home },
  { to: "/rep/agendamentos", label: "Agendamentos", Icon: Calendar },
  { to: "/rep/estatisticas", label: "Estatísticas", Icon: BarChart3 },
  { to: "/rep/clientes", label: "Meus Clientes", Icon: Users },
  { to: "/rep/inadimplencia", label: "Inadimplência", Icon: AlertTriangle },
  { to: "/rep/configuracoes", label: "Configurações", Icon: Settings },
];

interface RepMobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function RepMobileMenuSheet({ open, onOpenChange }: RepMobileMenuSheetProps) {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="lg:hidden max-h-[88vh] rounded-t-2xl border-border p-0">
        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <DrawerTitle className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
            Menu
          </DrawerTitle>
          <button
            aria-label="Fechar menu"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain border-t border-border px-4 py-4 [-webkit-overflow-scrolling:touch]"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="grid grid-cols-3 gap-2">
            {repMenuItems.map(({ to, label, Icon }) => {
              const isActive = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center transition-colors active:scale-[0.98]",
                    isActive ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium uppercase leading-tight tracking-wide">
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
            <ThemeToggle variant="ghost" className="flex-1 justify-start gap-2" showLabel />
            <button
              onClick={() => {
                onOpenChange(false);
                logout();
              }}
              className="flex flex-1 items-center justify-start gap-2 rounded-md px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>

          {user?.email && (
            <div className="mt-3 truncate px-1 text-[11px] text-muted-foreground">{user.email}</div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
