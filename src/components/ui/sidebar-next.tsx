
import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Blocks, ChevronsUpDown, FileClock, GraduationCap, Layout, LayoutDashboard, LogOut, MessageSquareText, MessagesSquare, Plus, Settings, UserCircle, UserCog, UserSearch, BarChart3, Users, Tag, Clipboard, Truck, PackageCheck, Layers, FileText, Cpu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { mainMenuItems, secondaryMenuItems, menuGroups } from "@/components/layout/navigation-items";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import AlertaIndicator from "@/components/common/AlertaIndicator";

const sidebarVariants = {
  open: {
    width: "15rem"
  },
  closed: {
    width: "3.05rem"
  }
};
const contentVariants = {
  open: {
    display: "block",
    opacity: 1
  },
  closed: {
    display: "block",
    opacity: 1
  }
};
const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: {
        stiffness: 1000,
        velocity: -100
      }
    }
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: {
        stiffness: 100
      }
    }
  }
};
const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
  staggerChildren: 0.1
};
const staggerVariants = {
  open: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.02
    }
  }
};

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const pathname = location.pathname;
  
  // Use state to store the alert count instead of directly accessing the store
  const [alertCount, setAlertCount] = useState(0);
  
  // Update alert count when component mounts and when alerts change - with proper cleanup
  useEffect(() => {
    // Function to get the current alert count
    function updateAlertCount() {
      const count = useAlertaStore.getState().getQuantidadeAlertasNaoLidas();
      setAlertCount(count);
    }
    
    // Initial count
    updateAlertCount();
    
    // Subscribe to changes
    const unsubscribe = useAlertaStore.subscribe(updateAlertCount);
    
    // Cleanup subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <motion.div 
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r fixed border-sidebar-border bg-sidebar")} 
      initial={isCollapsed ? "closed" : "open"} 
      animate={isCollapsed ? "closed" : "open"} 
      variants={sidebarVariants} 
      transition={transitionProps} 
      onMouseEnter={() => setIsCollapsed(false)} 
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div className="relative z-40 flex text-sidebar-foreground h-full shrink-0 flex-col transition-all" variants={contentVariants}>
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b border-sidebar-border p-2">
              <div className="mt-[1.5px] flex w-full">
                <div className="flex w-full items-center gap-2 px-2">
                  <img src="/lovable-uploads/021d1658-0d25-4427-a96e-47f6d10f9c8b.png" className="size-6 object-contain" alt="Logo" />
                  <motion.li variants={variants} className="flex w-fit items-center gap-2">
                    {!isCollapsed && <p className="text-md font-medium text-sidebar-foreground">
                        MischaOS
                      </p>}
                  </motion.li>
                </div>
              </div>
            </div>

            <div className="flex h-full w-full flex-col">
              <div className="flex grow flex-col gap-4">
                <ScrollArea className="h-16 grow p-2">
                  <div className={cn("flex w-full flex-col gap-1")}>
                    {/* Menu por grupos funcionais com indicadores visuais de cor */}
                    {menuGroups.map((group, index) => (
                      <div key={group.title} className="mt-2 first:mt-0">
                        {/* Cabeçalho do grupo com indicador de cor */}
                        <div className={cn(
                          "flex items-center px-2 py-1.5",
                          isCollapsed ? "justify-center" : "justify-start"
                        )}>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            group.variant === "operational" && "bg-purple-500",
                            group.variant === "tactical" && "bg-blue-500",
                            group.variant === "strategic" && "bg-green-500",
                            group.variant === "system" && "bg-gray-400"
                          )}/>
                          {!isCollapsed && (
                            <span className="ml-2 text-xs font-medium uppercase text-muted-foreground">
                              {group.title}
                            </span>
                          )}
                        </div>
                        
                        {/* Itens do grupo */}
                        <div className="space-y-1 mt-1">
                          {group.items.map(item => (
                            <Link 
                              key={item.path} 
                              to={item.path} 
                              className={cn(
                                "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", 
                                pathname === item.path && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              )}
                            >
                              {item.icon}
                              <motion.li variants={variants}>
                                {!isCollapsed && <p className="ml-2 text-sm">{item.label}</p>}
                              </motion.li>
                            </Link>
                          ))}
                        </div>
                        
                        {/* Separator between groups */}
                        {index < menuGroups.length - 1 && (
                          <Separator className="my-2 mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Área do usuário */}
              <div className="border-t border-sidebar-border p-2">
                <div className="flex flex-col space-y-2">
                  {!isCollapsed && <div className="flex items-center justify-between px-2 py-1">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6 bg-primary">
                          <AvatarFallback>A</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">Admin</p>
                          <p className="text-xs text-muted-foreground">admin@mischasbakery.com</p>
                        </div>
                      </div>
                    </div>}
                  
                  <div className="flex items-center justify-center space-x-1">
                    {isCollapsed ? (
                      <Link to="/alertas">
                        <Button variant="ghost" size="icon" className="relative size-8">
                          <Avatar className="size-6">
                            <AvatarFallback>A</AvatarFallback>
                          </Avatar>
                          {alertCount > 0 && (
                            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center">
                              {alertCount}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex w-full justify-between px-1">
                        <ThemeToggle />
                        <AlertaIndicator />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.ul>
      </motion.div>
    </motion.div>
  );
}

export function SidebarDemo() {
  return <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="flex h-screen grow flex-col overflow-auto">
      </main>
    </div>;
}
