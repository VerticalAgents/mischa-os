
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { mainMenuItems, secondaryMenuItems } from "@/components/layout/navigation-items";

type MobileMenuOverlayProps = {
  setIsMobileMenuOpen: (open: boolean) => void;
};

const MobileMenuOverlay = ({ setIsMobileMenuOpen }: MobileMenuOverlayProps) => {
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
            <div className="space-y-1">
              {mainMenuItems.map((item) => (
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
            <div className="space-y-1">
              {secondaryMenuItems.map((item) => (
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
          </nav>
        </div>
        <div className="absolute bottom-0 left-0 right-0 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-full bg-primary" />
              <div>
                <p className="text-sm font-medium">Administrador</p>
                <p className="text-xs text-muted-foreground">admin@mischasbakery.com</p>
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
