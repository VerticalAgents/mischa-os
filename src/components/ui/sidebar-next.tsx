
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Blocks, ChevronsUpDown, FileClock, GraduationCap, Layout, LayoutDashboard, LogOut, MessageSquareText, MessagesSquare, Plus, Settings, UserCircle, UserCog, UserSearch, BarChart3, Users, Tag, Clipboard, Truck, PackageCheck, Layers, FileText, Cpu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { menuGroups, type MenuGroup } from "@/components/layout/navigation-items";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import AlertaIndicator from "@/components/common/AlertaIndicator";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";
import mischasLogo from "@/assets/mischas-logo.png";

const sidebarVariants = {
  open: { width: "15rem" },
  closed: { width: "4rem" }
};

const contentVariants = {
  open: { opacity: 1 },
  closed: { opacity: 1 }
};

const variants = {
  open: { x: 0, opacity: 1, transition: { duration: 0.1, ease: "easeOut" } },
  closed: { x: -10, opacity: 0, transition: { duration: 0.1, ease: "easeIn" } }
};

const transitionProps = { type: "tween", ease: "easeOut", duration: 0.1 };

const staggerVariants = {
  open: { transition: { staggerChildren: 0.01, delayChildren: 0.01 } }
};

// Helper: check if a menu item path matches an allowed route key
function itemMatchesRoute(itemPath: string, routeKey: string): boolean {
  if (itemPath === routeKey) return true;
  const basePath = itemPath.split('?')[0];
  return basePath === routeKey;
}

interface SessionNavBarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SessionNavBar({ mobileOpen = false, onMobileClose }: SessionNavBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const pathname = location.pathname;
  const { userRole } = useUserRoles();
  const { allowedRoutes, loading: permLoading } = useMyPermissions();
  
  const [alertCount, setAlertCount] = useState(0);
  
  const checkMousePosition = useCallback((e: MouseEvent) => {
    if (sidebarRef.current && !isCollapsed) {
      const rect = sidebarRef.current.getBoundingClientRect();
      const isInside = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;
      if (!isInside) setIsCollapsed(true);
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (!isCollapsed) {
      const handler = (e: MouseEvent) => checkMousePosition(e);
      document.addEventListener('mousemove', handler);
      return () => document.removeEventListener('mousemove', handler);
    }
  }, [isCollapsed, checkMousePosition]);
  
  // Filter menu groups based on role and permissions
  const filteredMenuGroups = useMemo(() => {
    if (userRole === 'admin') {
      return menuGroups;
    }
    return menuGroups
      .filter(group => group.variant !== 'admin')
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          allowedRoutes.some(route => itemMatchesRoute(item.path, route))
        )
      }))
      .filter(group => group.items.length > 0);
  }, [userRole, allowedRoutes]);
  
  useEffect(() => {
    function updateAlertCount() {
      const count = useAlertaStore.getState().getQuantidadeAlertasNaoLidas();
      setAlertCount(count);
    }
    updateAlertCount();
    const unsubscribe = useAlertaStore.subscribe(updateAlertCount);
    return () => { unsubscribe(); };
  }, []);

  // Desktop sidebar (hidden on mobile)
  const desktopSidebar = (
    <motion.div 
      ref={sidebarRef}
      className="sidebar fixed left-0 z-40 h-full shrink-0 border-r hidden lg:block"
      style={{ backgroundColor: '#d1193a', borderColor: 'rgba(255,255,255,0.2)' }}
      initial="closed"
      animate={isCollapsed ? "closed" : "open"} 
      variants={sidebarVariants} 
      transition={transitionProps} 
      onHoverStart={() => setIsCollapsed(false)} 
      onHoverEnd={() => setIsCollapsed(true)}
    >
      <SidebarContent
        isCollapsed={isCollapsed}
        filteredMenuGroups={filteredMenuGroups}
        pathname={pathname}
        alertCount={alertCount}
        onNavClick={() => setIsCollapsed(true)}
      />
    </motion.div>
  );

  // Mobile sidebar (overlay)
  const mobileSidebar = (
    <AnimatePresence>
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
          {/* Sidebar panel */}
          <motion.div
            className="fixed left-0 top-0 h-full z-50 lg:hidden border-r"
            style={{ backgroundColor: '#d1193a', borderColor: 'rgba(255,255,255,0.2)', width: '16rem' }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
          >
            <SidebarContent
              isCollapsed={false}
              filteredMenuGroups={filteredMenuGroups}
              pathname={pathname}
              alertCount={alertCount}
              onNavClick={() => onMobileClose?.()}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
    </>
  );
}

// Extracted shared sidebar content
function SidebarContent({
  isCollapsed,
  filteredMenuGroups,
  pathname,
  alertCount,
  onNavClick
}: {
  isCollapsed: boolean;
  filteredMenuGroups: MenuGroup[];
  pathname: string;
  alertCount: number;
  onNavClick: () => void;
}) {
  return (
    <motion.div className="relative z-40 flex text-white h-full shrink-0 flex-col transition-all" variants={contentVariants}>
      <motion.ul variants={staggerVariants} className="flex h-full flex-col">
        <div className="flex grow flex-col items-center">
          <div className="flex h-[54px] w-full shrink-0 border-b p-2" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
            <div className="mt-[1.5px] flex w-full">
              <div className={cn(
                "flex w-full items-center gap-2",
                isCollapsed ? "justify-center px-0" : "px-2"
              )}>
                <img 
                  src={mischasLogo} 
                  className={cn(
                    "object-cover rounded-full border-2 border-white shrink-0",
                    isCollapsed ? "size-10" : "size-8"
                  )} 
                  alt="Mischa's Bakery Logo" 
                />
                <motion.li variants={variants} className="flex w-fit items-center gap-2">
                  {!isCollapsed && <p className="text-md font-medium text-white">MISCHA'S BAKERY</p>}
                </motion.li>
              </div>
            </div>
          </div>

          <div className="flex h-full w-full flex-col">
            <div className="flex grow flex-col gap-4">
              <ScrollArea className="h-16 grow p-2">
                <div className={cn("flex w-full flex-col gap-1")}>
                  {filteredMenuGroups.map((group, index) => (
                    <div key={group.title} className="mt-2 first:mt-0">
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
                      
                      <div className="space-y-1 mt-1">
                        {group.items.map(item => (
                          <Link 
                            key={item.path} 
                            to={item.path}
                            onClick={onNavClick}
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
                      
                      {index < filteredMenuGroups.length - 1 && (
                        <Separator className="my-2 mx-2 bg-white/20" />
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            
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
  );
}

export function SidebarDemo() {
  return <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="flex h-screen grow flex-col overflow-auto">
      </main>
    </div>;
}
