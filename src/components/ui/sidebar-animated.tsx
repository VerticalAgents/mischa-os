import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useRoutePersistence } from "@/hooks/useRoutePersistence";
import { Link } from 'react-router-dom';

interface SidebarLogoProps {
  title: string;
  currentLogoSrc: string;
  showFullContent: boolean;
}

const SidebarLogo = ({ title, currentLogoSrc, showFullContent }: SidebarLogoProps) => (
  <div className="flex items-center justify-center p-4 border-b border-sidebar-border">
    <Link to="/" className={cn("flex items-center", showFullContent ? "space-x-2" : "justify-center w-full")}>
      <img src={currentLogoSrc} alt="Logo" className="h-8 w-8" />
      {showFullContent && (
        <span className="font-bold text-lg text-sidebar-foreground">{title}</span>
      )}
    </Link>
  </div>
);

interface SidebarItemProps {
  link: {
    href: string;
    label: string;
    icon: React.ReactNode;
  };
  active: boolean;
  showFullContent: boolean;
  onClick?: () => void;
}

interface SidebarAnimatedProps {
  logoTitle: string;
  logoSrc: string;
  sidebarLinks: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

const SidebarItem = ({ link, active, showFullContent, onClick }: SidebarItemProps) => (
  <li>
    <Link
      to={link.href}
      onClick={(e) => {
        if (onClick) {
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
    </Link>
  </li>
);

export const SidebarAnimated = ({
  logoTitle,
  logoSrc,
  sidebarLinks,
}: SidebarAnimatedProps) => {
  const { showFullContent, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const { clearRoutePersistence } = useRoutePersistence();
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SheetHeader className="space-y-2.5">
            <SheetTitle>Menu</SheetTitle>
            <SheetDescription>
              Navegue pelo sistema
            </SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "group/sidebar fixed left-0 top-0 flex h-full w-20 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar-background transition-all duration-300",
          showFullContent ? "md:w-60" : "md:w-20"
        )}
      >
        <SidebarLogo
          title={logoTitle}
          currentLogoSrc={logoSrc}
          showFullContent={showFullContent}
        />

        <nav className="flex-1">
          <ul className="flex flex-col gap-0.5 p-4">
            {sidebarLinks.map((link) => (
              <SidebarItem
                key={link.href}
                link={link}
                active={false}
                showFullContent={showFullContent}
                onClick={() => {}}
              />
            ))}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="group w-full justify-start rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-background-hover"
            onClick={async () => {
              await signOut();
              clearRoutePersistence();
              toggleSidebar();
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-4 w-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" x2="9" y1="12" y2="12"></line>
            </svg>
            <span className={cn(showFullContent ? "block" : "hidden", "group-hover:block")}>
              Sair
            </span>
          </Button>
        </div>
      </aside>
    </>
  );
};
