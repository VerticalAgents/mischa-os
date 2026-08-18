import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Clipboard, Truck, Layers, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainMenuItems } from "@/components/layout/navigation-items";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";
import MobileMenuSheet from "@/components/layout/MobileMenuSheet";

const dockCandidates = [
  { path: "/home", label: "Início", Icon: Home },
  { path: "/agendamento", label: "Agenda", Icon: Clipboard },
  { path: "/expedicao", label: "Expedição", Icon: Truck },
  { path: "/pcp", label: "PCP", Icon: Layers },
];

export default function MobileDock() {
  const { pathname } = useLocation();
  const { userRole } = useUserRoles();
  const { allowedRoutes } = useMyPermissions();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const items = useMemo(() => {
    const available = new Set(
      mainMenuItems
        .filter((item) =>
          userRole === "admin"
            ? true
            : allowedRoutes.some(
                (route) => item.path === route || item.path.split("?")[0] === route
              )
        )
        .map((item) => item.path.split("?")[0])
    );
    return dockCandidates.filter((item) => available.has(item.path));
  }, [userRole, allowedRoutes]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch justify-around px-1 py-1.5">
          {items.map(({ path, label, Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
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
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-1 py-1.5 transition-colors",
              menuOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium uppercase tracking-wide">Mais</span>
          </button>
        </div>
      </nav>

      <MobileMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
    </>
  );
}
