
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { menuGroups } from "@/components/layout/navigation-items";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";
import { useMemo } from "react";

type MobileMenuOverlayProps = {
  setIsMobileMenuOpen: (open: boolean) => void;
};

function itemMatchesRoute(itemPath: string, routeKey: string): boolean {
  if (itemPath === routeKey) return true;
  const basePath = itemPath.split('?')[0];
  return basePath === routeKey;
}

const MobileMenuOverlay = ({ setIsMobileMenuOpen }: MobileMenuOverlayProps) => {
  const { userRole } = useUserRoles();
  const { allowedRoutes } = useMyPermissions();

  const filteredGroups = useMemo(() => {
    if (userRole === 'admin') return menuGroups;
    return menuGroups
      .filter(g => g.variant !== 'admin')
      .map(g => ({
        ...g,
        items: g.items.filter(item =>
          allowedRoutes.some(route => itemMatchesRoute(item.path, route))
        )
      }))
      .filter(g => g.items.length > 0);
  }, [userRole, allowedRoutes]);

  return (
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
      onClick={() => setIsMobileMenuOpen(false)}
    >
      <div
        className="fixed left-0 top-0 h-full w-3/4 max-w-xs bg-background shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center border-b px-6">
          <Link to="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
            <img src="/logo.svg" alt="Mischa's Bakery Logo" className="h-6 w-6" />
            <span className="font-bold">Mischa's Bakery</span>
          </Link>
        </div>
        <div className="px-4 py-6">
          <nav className="space-y-6">
            {filteredGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-xs font-medium uppercase text-muted-foreground">{group.title}</p>
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )
                    }
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium">Funcionário</p>
              </div>
            </div>
            <ThemeToggle className="scale-75" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenuOverlay;
