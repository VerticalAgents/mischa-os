
import { Link, useLocation } from "react-router-dom";
import {
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { mainMenuItems } from "@/components/layout/navigation-items";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";

interface SidebarProps {
  showLabels: boolean;
  onItemClick?: () => void;
}

const SidebarContent = ({ showLabels, onItemClick }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useAuth();
  const { userRole } = useUserRoles();
  const { allowedRoutes, loading: permLoading } = useMyPermissions();

  const filteredItems = (() => {
    // Admin sees everything
    if (userRole === 'admin') return mainMenuItems;

    // Staff: use DB permissions if available, otherwise show nothing
    if (allowedRoutes.length > 0) {
      return mainMenuItems.filter(item =>
        allowedRoutes.some(p => item.path === p || item.path.startsWith(p + '?') || item.path.startsWith(p + '/'))
      );
    }

    // Fallback: show only home
    return mainMenuItems.filter(item => item.path === '/home');
  })();

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="mb-6 mt-3 flex items-center px-2">
        {showLabels ? (
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md p-2 text-lg font-semibold transition-colors hover:bg-accent"
            onClick={onItemClick}
          >
            <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
            <span>Mischa's Bakery</span>
          </Link>
        ) : (
          <Link
            to="/"
            className="flex items-center justify-center rounded-md p-2 transition-colors hover:bg-accent"
            onClick={onItemClick}
          >
            <img src="/logo.svg" alt="Logo" className="h-6 w-6" />
          </Link>
        )}
      </div>

      <nav className="space-y-1 px-2">
        {filteredItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              location.pathname === item.path
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent hover:text-accent-foreground"
            )}
            onClick={onItemClick}
          >
            {item.icon}
            {showLabels && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="mt-auto space-y-1 px-2 pb-4">
        <ThemeToggle
          variant="ghost"
          className={cn(
            "flex w-full justify-start gap-2 px-3 py-2",
            showLabels ? "justify-start" : "justify-center"
          )}
          showLabel={showLabels}
        />
        <button
          className={cn(
            "flex w-full items-center rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
            showLabels ? "justify-start gap-3" : "justify-center"
          )}
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          {showLabels && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
};

export default SidebarContent;
