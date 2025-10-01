
import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { useThemeStore } from "@/lib/theme";
import { Link } from "react-router-dom";

// Interface definitions
interface SidebarContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  animate: boolean;
}

interface SidebarProps {
  open?: boolean;
  setOpen?: (open: boolean) => void;
  animate?: boolean;
  children?: React.ReactNode;
}

interface SidebarBodyProps {
  className?: string;
  children?: React.ReactNode;
}

interface SidebarLinkProps {
  link: {
    label: string;
    href: string;
    icon: React.ReactNode;
  };
  active?: boolean;
  onClick?: () => void;
}

interface SidebarHeaderProps {
  className?: string;
  logoSrc?: string;
  title?: string;
  darkModeLogo?: string;
  lightModeLogo?: string;
}

// Create context for sidebar state management
const SidebarContext = createContext<SidebarContextType>({
  open: true,
  setOpen: () => {},
  animate: true
});

// Hook to use the sidebar context
export const useSidebar = () => useContext(SidebarContext);

// Sidebar Provider component
export const SidebarProvider = ({
  children,
  defaultOpen = true,
  animate = true
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
  animate?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Sidebar component
export const Sidebar = ({ children, open: propOpen, setOpen: propSetOpen, animate = true }: SidebarProps) => {
  const context = useSidebar();
  const isOpen = propOpen !== undefined ? propOpen : context.open;
  const setIsOpen = propSetOpen || context.setOpen;
  const shouldAnimate = animate !== undefined ? animate : context.animate;
  
  return (
    <SidebarProvider defaultOpen={isOpen} animate={shouldAnimate}>
      <aside
        className={cn(
          "border-r bg-sidebar-background text-sidebar-foreground h-screen transition-all fixed left-0 z-10",
          shouldAnimate
            ? isOpen
              ? "w-64"
              : "w-16"
            : "w-64"
        )}
      >
        <div className="absolute right-0 top-3 transform translate-x-1/2 z-10">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full h-6 w-6 bg-background text-foreground border-border"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronLeft className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        </div>
        {children}
      </aside>
    </SidebarProvider>
  );
};

// Sidebar body component
export const SidebarBody = ({ className, children }: SidebarBodyProps) => {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {children}
    </div>
  );
};

// Sidebar header component
export const SidebarHeader = ({ 
  className, 
  logoSrc = "/logo.svg", 
  title = "MischaOS",
  darkModeLogo = "/logo.svg",
  lightModeLogo = "/logo.svg"
}: SidebarHeaderProps) => {
  const { open, animate } = useSidebar();
  const { isDark } = useThemeStore();
  const showFullContent = animate ? open : true;
  
  // Use the appropriate logo based on the theme
  const currentLogoSrc = isDark ? darkModeLogo : lightModeLogo;
  
  return (
    <div className={cn("flex h-14 items-center border-b px-6", className)}>
      <Link to="/" className={cn("flex items-center", showFullContent ? "space-x-2" : "justify-center w-full")}>
        <img src={currentLogoSrc} alt="Logo" className="h-8 w-8" />
        {showFullContent && (
          <span className="font-bold text-lg text-sidebar-foreground">{title}</span>
        )}
      </Link>
    </div>
  );
};

// Sidebar link component
export const SidebarLink = ({ link, active, onClick }: SidebarLinkProps) => {
  const { open, animate } = useSidebar();
  const showFullContent = animate ? open : true;
  
  return (
    <a
      href={link.href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
        showFullContent ? "justify-start" : "justify-center",
        active
          ? "bg-primary text-primary-foreground hover:bg-primary/90"
          : "hover:bg-sidebar-background-hover"
      )}
    >
      <span className="flex-shrink-0">{link.icon}</span>
      {showFullContent && <span className="truncate">{link.label}</span>}
    </a>
  );
};

export default {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarHeader,
  useSidebar
};
