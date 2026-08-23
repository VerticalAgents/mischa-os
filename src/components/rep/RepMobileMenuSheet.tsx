import { Link, useLocation } from "react-router-dom";
import { Home, Users, Calendar, BarChart3, Settings, LogOut, X, AlertTriangle } from "lucide-react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { useThemeStore } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  VERMELHO,
  BORDA_INTERNA,
  ROTULO_BLOCO,
  azulejoVermelho,
  linhaVermelha,
  gavetaVermelha,
} from "@/components/mobile/bloco-vermelho";

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
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className={gavetaVermelha}
        style={{ backgroundColor: VERMELHO, borderColor: BORDA_INTERNA }}
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <DrawerTitle className={`${ROTULO_BLOCO} text-white`}>Menu</DrawerTitle>
          <button
            aria-label="Fechar menu"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto overscroll-contain border-t px-4 py-4 [-webkit-overflow-scrolling:touch]"
          style={{ borderColor: BORDA_INTERNA, paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="grid grid-cols-3 gap-2">
            {repMenuItems.map(({ to, label, Icon }) => {
              const isActive = pathname === to || pathname.startsWith(to + "/");
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => onOpenChange(false)}
                  className={azulejoVermelho(isActive)}
                >
                  <Icon className="h-5 w-5" />
                  <span className={`${ROTULO_BLOCO} leading-tight`}>{label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-5 flex items-center gap-2 border-t pt-4" style={{ borderColor: BORDA_INTERNA }}>
            <button
              onClick={toggleTheme}
              className={linhaVermelha}
              title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? "Modo claro" : "Modo escuro"}
            </button>
            <button
              onClick={() => {
                onOpenChange(false);
                logout();
              }}
              className={linhaVermelha}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>

          {user?.email && (
            <div className="mt-3 truncate px-1 text-[11px] text-white/60">{user.email}</div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
