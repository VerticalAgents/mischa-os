import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useThemeStore } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import {
  VERMELHO,
  BORDA_INTERNA,
  ROTULO_BLOCO,
  azulejoVermelho,
  linhaVermelha,
  gavetaVermelha,
} from "@/components/mobile/bloco-vermelho";
import { menuGroups, type MenuGroup } from "@/components/layout/navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";

function itemMatchesRoute(itemPath: string, routeKey: string): boolean {
  return itemPath === routeKey || itemPath.split("?")[0] === routeKey;
}

const groupTitles: Record<MenuGroup["variant"], string> = {
  main: "Principal",
  operational: "Operação",
  tactical: "Comercial",
  strategic: "Inteligência",
  system: "Sistema",
  admin: "Administração",
};

interface MobileMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileMenuSheet({ open, onOpenChange }: MobileMenuSheetProps) {
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useThemeStore();
  const { userRole } = useUserRoles();
  const { allowedRoutes } = useMyPermissions();

  const groups = useMemo(() => {
    if (userRole === "admin") return menuGroups;
    return menuGroups
      .filter((group) => group.variant !== "admin")
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          allowedRoutes.some((route) => itemMatchesRoute(item.path, route))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [userRole, allowedRoutes]);

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
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 px-1 text-[0.65rem] font-semibold uppercase tracking-[1.5px] text-white/60">
                  {groupTitles[group.variant] ?? group.title}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path.split("?")[0];
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => onOpenChange(false)}
                        className={azulejoVermelho(isActive)}
                      >
                        <span className="[&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
                        <span className={`${ROTULO_BLOCO} leading-tight`}>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 border-t pt-4" style={{ borderColor: BORDA_INTERNA }}>
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
