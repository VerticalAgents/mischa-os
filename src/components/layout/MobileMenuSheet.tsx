import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
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
          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
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
                        className={cn(
                          "flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-xl px-2 py-3 text-center transition-colors active:scale-[0.98]",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <span className="[&_svg]:h-5 [&_svg]:w-5">{item.icon}</span>
                        <span className="text-[11px] font-medium uppercase leading-tight tracking-wide">
                          {item.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2 border-t border-border pt-4">
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
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
