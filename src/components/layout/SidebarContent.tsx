
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { 
  BarChart3, Users, Tag, Clipboard, ShoppingBag, 
  Settings, Layers, Truck, FileText, Bell 
} from "lucide-react";
import { SidebarLink } from "@/components/ui/sidebar-animated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Menu items definition
import { mainMenuItems, secondaryMenuItems } from "@/components/layout/navigation-items";

const SidebarContent = () => {
  const location = useLocation();
  const quantidadeAlertasNaoLidas = useAlertaStore((state) => state.getQuantidadeAlertasNaoLidas());
  
  return (
    <>
      {/* Sidebar Header */}
      <div className="flex h-14 items-center border-b px-6">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="Mischa's Bakery Logo" className="h-8 w-8" />
          <span className="font-bold text-lg text-sidebar-foreground">Mischa's Bakery</span>
        </Link>
      </div>
      
      {/* Main Menu */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <SidebarLink
                key={item.path}
                link={{
                  label: item.label,
                  href: item.path,
                  icon: <div className="text-current">{item.icon}</div>,
                }}
                active={location.pathname === item.path}
              />
            ))}
          </div>
          <div className="space-y-1">
            {secondaryMenuItems.map((item) => (
              <SidebarLink
                key={item.path}
                link={{
                  label: item.label,
                  href: item.path,
                  icon: <div className="text-current">{item.icon}</div>,
                }}
                active={location.pathname === item.path}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* User Info & Alerts */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">Administrador</p>
              <p className="text-xs text-muted-foreground">admin@mischasbakery.com</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/alertas">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {quantidadeAlertasNaoLidas > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                    {quantidadeAlertasNaoLidas}
                  </Badge>
                )}
              </Button>
            </Link>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarContent;
