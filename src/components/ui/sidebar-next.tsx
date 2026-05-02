import React, { useState, useMemo, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Boxes,
  Users,
  DollarSign,
  LayoutGrid,
  Settings,
  Bell,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { menuGroups, type MenuGroup } from "@/components/layout/navigation-items";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useMyPermissions } from "@/hooks/useRolePermissions";
import mischasLogo from "@/assets/mischas-logo.png";

/**
 * HubSpot-style sidebar:
 * - Narrow rail (always visible) with 1 icon per area.
 * - Hovering an icon opens a light flyout panel to the right with the area's items.
 * - Mobile: full panel slides in from left (unchanged behavior).
 */

function itemMatchesRoute(itemPath: string, routeKey: string): boolean {
  if (itemPath === routeKey) return true;
  const basePath = itemPath.split("?")[0];
  return basePath === routeKey;
}

// Map each variant to a representative icon shown on the rail
const variantIcon: Record<MenuGroup["variant"], React.ComponentType<{ className?: string }>> = {
  main: Home,
  operational: Boxes,
  tactical: Users,
  strategic: LayoutGrid,
  system: Settings,
  admin: DollarSign, // rare; admin shown alongside system
};

// Friendlier area titles in the flyout header
const areaTitle: Record<MenuGroup["variant"], string> = {
  main: "Início",
  operational: "Operações",
  tactical: "Comercial",
  strategic: "Inteligência",
  system: "Sistema",
  admin: "Administração",
};

interface SessionNavBarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SessionNavBar({ mobileOpen = false, onMobileClose }: SessionNavBarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { userRole } = useUserRoles();
  const { allowedRoutes } = useMyPermissions();

  const [alertCount, setAlertCount] = useState(0);
  const [hoveredVariant, setHoveredVariant] = useState<MenuGroup["variant"] | null>(null);
  const [flyoutTop, setFlyoutTop] = useState<number>(0);
  const closeTimer = useRef<number | null>(null);

  const filteredMenuGroups = useMemo(() => {
    if (userRole === "admin") return menuGroups;
    return menuGroups
      .filter((group) => group.variant !== "admin")
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          allowedRoutes.some((route) => itemMatchesRoute(item.path, route))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [userRole, allowedRoutes]);

  useEffect(() => {
    function updateAlertCount() {
      setAlertCount(useAlertaStore.getState().getQuantidadeAlertasNaoLidas());
    }
    updateAlertCount();
    const unsubscribe = useAlertaStore.subscribe(updateAlertCount);
    return () => {
      unsubscribe();
    };
  }, []);

  // Close flyout when route changes
  useEffect(() => {
    setHoveredVariant(null);
  }, [pathname]);

  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setHoveredVariant(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const activeGroup =
    hoveredVariant != null
      ? filteredMenuGroups.find((g) => g.variant === hoveredVariant) ?? null
      : null;

  // ==== Desktop rail ====
  const desktopRail = (
    <aside
      className="fixed left-0 top-0 z-40 hidden h-full w-[3.05rem] shrink-0 border-r lg:flex flex-col"
      style={{ backgroundColor: "#d1193a", borderColor: "rgba(255,255,255,0.15)" }}
      onMouseLeave={scheduleClose}
    >
      {/* Logo */}
      <div
        className="flex h-[54px] w-full items-center justify-center border-b"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
      >
        <img
          src={mischasLogo}
          alt="Mischa's Bakery"
          className="size-9 rounded-full border-2 border-white object-cover"
        />
      </div>

      {/* Rail icons */}
      <nav className="flex flex-1 flex-col items-center gap-1 py-3">
        {filteredMenuGroups.map((group) => {
          const Icon = variantIcon[group.variant] ?? LayoutGrid;
          const isActive =
            group.items.some((it) => pathname === it.path.split("?")[0]) ||
            hoveredVariant === group.variant;
          return (
            <button
              key={group.variant + group.title}
              type="button"
              onMouseEnter={(e) => {
                cancelClose();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setFlyoutTop(rect.top);
                setHoveredVariant(group.variant);
              }}
              onFocus={(e) => {
                cancelClose();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setFlyoutTop(rect.top);
                setHoveredVariant(group.variant);
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md text-white/85 transition-colors",
                "hover:bg-white/15 hover:text-white",
                isActive && "bg-white/20 text-white"
              )}
              aria-label={areaTitle[group.variant]}
              title={areaTitle[group.variant]}
            >
              <Icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
      </nav>

      {/* Bottom: alerts */}
      <div
        className="flex flex-col items-center gap-1 border-t py-2"
        style={{ borderColor: "rgba(255,255,255,0.15)" }}
      >
        <Link to="/alertas" onMouseEnter={scheduleClose}>
          <Button
            variant="ghost"
            size="icon"
            className="relative size-9 text-white hover:bg-white/15"
            aria-label="Alertas"
          >
            <Bell className="h-[18px] w-[18px]" />
            {alertCount > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold text-[#d1193a]">
                {alertCount}
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    </aside>
  );

  // ==== Desktop flyout ====
  const desktopFlyout = (
    <AnimatePresence>
      {activeGroup && (
        <motion.div
          key={activeGroup.variant}
          className="fixed left-[3.05rem] z-40 hidden lg:block"
          style={{ top: flyoutTop }}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.12, ease: "easeOut" }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="ml-2 w-64 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg">
            <div className="px-3 pb-2 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Área
              </p>
              <p className="text-sm font-semibold text-foreground">
                {areaTitle[activeGroup.variant]}
              </p>
            </div>
            <div className="my-1 h-px bg-border" />
            <ul className="flex flex-col gap-0.5 py-1">
              {activeGroup.items.map((item) => {
                const isActive = pathname === item.path.split("?")[0];
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setHoveredVariant(null)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-accent font-medium text-accent-foreground"
                      )}
                    >
                      <span className="text-foreground/80">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ==== Mobile sidebar (full panel) ====
  const mobileSidebar = (
    <AnimatePresence>
      {mobileOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
          <motion.div
            className="fixed left-0 top-0 z-50 h-full w-64 border-r lg:hidden"
            style={{ backgroundColor: "#d1193a", borderColor: "rgba(255,255,255,0.2)" }}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
          >
            <div
              className="flex h-[54px] items-center gap-2 border-b px-3"
              style={{ borderColor: "rgba(255,255,255,0.2)" }}
            >
              <img
                src={mischasLogo}
                alt="Mischa's"
                className="size-8 rounded-full border-2 border-white object-cover"
              />
              <p className="text-sm font-semibold text-white">MISCHA'S BAKERY</p>
            </div>
            <nav className="flex flex-col gap-3 overflow-y-auto p-2">
              {filteredMenuGroups.map((group) => (
                <div key={group.variant + group.title}>
                  <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
                    {areaTitle[group.variant]}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.path.split("?")[0];
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            onClick={onMobileClose}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/90 transition-colors hover:bg-white/15",
                              isActive && "bg-white/25 font-medium text-white"
                            )}
                          >
                            {item.icon}
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopRail}
      {desktopFlyout}
      {mobileSidebar}
    </>
  );
}

export function SidebarDemo() {
  return (
    <div className="flex h-screen w-screen flex-row">
      <SessionNavBar />
      <main className="flex h-screen grow flex-col overflow-auto" />
    </div>
  );
}
