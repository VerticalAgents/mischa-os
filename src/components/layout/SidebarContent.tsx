
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Bell, Clock } from "lucide-react";
import { SidebarLink, SidebarHeader, useSidebar } from "@/components/ui/sidebar-animated";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Menu items definition
import { mainMenuItems, secondaryMenuItems } from "@/components/layout/navigation-items";

const SidebarContent = () => {
  const location = useLocation();
  const quantidadeAlertasNaoLidas = useAlertaStore((state) => state.getQuantidadeAlertasNaoLidas());
  const { open, animate } = useSidebar();
  
  // Determine if we should show full content based on sidebar state
  const showFullContent = animate ? open : true;
  
  return (
    <>
      {/* Sidebar Header with Logo and Title */}
      <SidebarHeader />
      
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
        {showFullContent ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8 bg-primary">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
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
              <div>
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            {/* When sidebar is minimized, show only icons */}
            <div className="flex flex-col space-y-4 items-center">
              <Avatar className="h-8 w-8 bg-primary">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              
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
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SidebarContent;
