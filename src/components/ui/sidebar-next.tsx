
import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Blocks, ChevronsUpDown, FileClock, GraduationCap, Layout, LayoutDashboard, LogOut, MessageSquareText, MessagesSquare, Plus, Settings, UserCircle, UserCog, UserSearch, BarChart3, Users, Tag, Clipboard, Truck, PackageCheck, Layers, FileText, Cpu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { mainMenuItems, secondaryMenuItems, menuGroups } from "@/components/layout/navigation-items";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import AlertaIndicator from "@/components/common/AlertaIndicator";
import { useUserRoles } from "@/hooks/useUserRoles";
import mischasLogo from "@/assets/mischas-logo.png";

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
    opacity: 1
  },
  closed: {
    opacity: 1
  }
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.1,
      ease: "easeOut"
    }
  },
  closed: {
    x: -10,
    opacity: 0,
    transition: {
      duration: 0.1,
      ease: "easeIn"
    }
  }
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.1
};

const staggerVariants = {
  open: {
    transition: {
      staggerChildren: 0.01,
      delayChildren: 0.01
    }
  }
};

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const location = useLocation();
  const pathname = location.pathname;
  const { userRole } = useUserRoles();
  
  // Use state to store the alert count instead of directly accessing the store
  const [alertCount, setAlertCount] = useState(0);
  
  // Filter menu groups - hide admin groups for non-admin users
  const filteredMenuGroups = useMemo(() => {
    return menuGroups.filter(group => {
      if (group.variant === 'admin') {
        return userRole === 'admin';
      }
      return true;
    });
  }, [userRole]);
  
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
      className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r fixed")} 
      style={{ backgroundColor: '#d1193a', borderColor: 'rgba(255,255,255,0.2)' }}
      initial={isCollapsed ? "closed" : "open"} 
      animate={isCollapsed ? "closed" : "open"} 
      variants={sidebarVariants} 
      transition={transitionProps} 
      onMouseEnter={() => setIsCollapsed(false)} 
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <motion.div className="relative z-40 flex text-white h-full shrink-0 flex-col transition-all" variants={contentVariants}>
        <motion.ul variants={staggerVariants} className="flex h-full flex-col">
          <div className="flex grow flex-col items-center">
            <div className="flex h-[54px] w-full shrink-0 border-b p-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              <div className="mt-[1.5px] flex w-full">
                <div className="flex w-full items-center gap-2 px-2">
                  <img src={mischasLogo} className="size-8 object-cover rounded-full border-2 border-white" alt="Mischa's Bakery Logo" />
                  <motion.li variants={variants} className="flex w-fit items-center gap-2">
                    {!isCollapsed && <p className="text-md font-medium text-white">
                        MISCHA'S BAKERY
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
                    {filteredMenuGroups.map((group, index) => (
                      <div key={group.title} className="mt-2 first:mt-0">
                        {/* Cabeçalho do grupo com indicador de cor */}
                        <div className={cn(
                          "flex items-center px-2 py-1.5",
                          isCollapsed ? "justify-center" : "justify-start"
                        )}>
                          <div className={cn(
                            "h-2 w-2 rounded-full",
                            group.variant === "main" && "bg-white",
                            group.variant === "operational" && "bg-pink-200",
                            group.variant === "tactical" && "bg-pink-300",
                            group.variant === "strategic" && "bg-pink-100",
                            group.variant === "system" && "bg-white/60",
                            group.variant === "admin" && "bg-yellow-300"
                          )}/>
                          {!isCollapsed && (
                            <span className="ml-2 text-xs font-medium uppercase text-white/70 text-left">
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
                              onClick={() => setIsCollapsed(true)}
                              className={cn(
                                "flex h-8 w-full flex-row items-center rounded-md px-2 py-1.5 transition text-white hover:bg-white/20", 
                                pathname === item.path && "bg-white/25 font-medium"
                              )}
                            >
                              {item.icon}
                              <motion.li variants={variants}>
                                {!isCollapsed && <p className="ml-2 text-sm text-left text-white">{item.label}</p>}
                              </motion.li>
                            </Link>
                          ))}
                        </div>
                        
                        {/* Separator between groups */}
                        {index < filteredMenuGroups.length - 1 && (
                          <Separator className="my-2 mx-2 bg-white/20" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              {/* Área de alertas */}
              <div className="border-t p-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                <div className="flex items-center justify-center">
                  {isCollapsed ? (
                    <Link to="/alertas">
                      <Button variant="ghost" size="icon" className="relative size-8 text-white hover:bg-white/20">
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-white text-[#d1193a]">
                          {alertCount}
                        </Badge>
                      </Button>
                    </Link>
                  ) : (
                    <div className="w-full px-1">
                      <AlertaIndicator />
                    </div>
                  )}
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
