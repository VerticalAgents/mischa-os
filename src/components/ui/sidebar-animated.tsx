
import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

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
          "border-r bg-sidebar-background text-sidebar-foreground h-screen transition-all",
          shouldAnimate
            ? isOpen
              ? "w-64"
              : "w-16"
            : "w-64"
        )}
      >
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
      <span>{link.icon}</span>
      {showFullContent && <span>{link.label}</span>}
    </a>
  );
};
