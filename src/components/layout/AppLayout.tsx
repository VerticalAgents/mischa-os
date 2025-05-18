
import { ReactNode, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarProvider, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Bell, BarChart3, Users, List, Tag, Clipboard, ShoppingBag, Settings, Menu, Layers, Truck, FileText } from "lucide-react";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MenuItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
};

const mainMenuItems: MenuItem[] = [
  {
    label: "Dashboard & Analytics",
    path: "/",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: "Precificação",
    path: "/precificacao",
    icon: <Tag className="h-5 w-5" />,
  },
  {
    label: "Agendamento",
    path: "/agendamento",
    icon: <Clipboard className="h-5 w-5" />,
  },
  {
    label: "Expedição",
    path: "/expedicao",
    icon: <Truck className="h-5 w-5" />,
  },
  {
    label: "Estoque",
    path: "/estoque",
    icon: <ShoppingBag className="h-5 w-5" />,
  },
  {
    label: "PCP",
    path: "/pcp",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    label: "Projeções",
    path: "/projecoes",
    icon: <FileText className="h-5 w-5" />,
  },
];

const secondaryMenuItems: MenuItem[] = [
  {
    label: "Configurações",
    path: "/configuracoes",
    icon: <Settings className="h-5 w-5" />,
  },
];

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const quantidadeAlertasNaoLidas = useAlertaStore((state) => state.getQuantidadeAlertasNaoLidas());

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar para Desktop */}
        <Sidebar className="hidden lg:flex">
          <SidebarHeader className="flex h-14 items-center border-b px-6">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Mischa's Bakery Logo" className="h-8 w-8" />
              <span className="font-bold text-lg">Mischa's Bakery</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-4 py-6">
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
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )
                    }
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
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </nav>
          </SidebarContent>
          <SidebarFooter className="border-t p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary" />
                <div>
                  <p className="text-sm font-medium">Administrador</p>
                  <p className="text-xs text-muted-foreground">admin@mischasbakery.com</p>
                </div>
              </div>
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
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Header */}
        <div className="fixed top-0 left-0 right-0 h-14 border-b bg-background px-4 flex items-center justify-between lg:hidden z-50">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
              <Menu className="h-5 w-5" />
            </Button>
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.svg" alt="Mischa's Bakery Logo" className="h-6 w-6" />
              <span className="font-bold">Mischa's Bakery</span>
            </Link>
          </div>
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

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            onClick={toggleMobileMenu}
          >
            <div
              className="fixed left-0 top-0 h-full w-3/4 max-w-xs bg-background shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-14 items-center border-b px-6">
                <Link to="/" className="flex items-center space-x-2" onClick={toggleMobileMenu}>
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
                        onClick={toggleMobileMenu}
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
                        onClick={toggleMobileMenu}
                      >
                        {item.icon}
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </nav>
              </div>
              <div className="absolute bottom-0 left-0 right-0 border-t p-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-medium">Administrador</p>
                    <p className="text-xs text-muted-foreground">admin@mischasbakery.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto pt-14 lg:pt-0">
          <div className="container py-6 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
