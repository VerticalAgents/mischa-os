
import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAlertaStore } from "@/hooks/useAlertaStore";

type MobileHeaderProps = {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
};

const MobileHeader = ({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: MobileHeaderProps) => {
  const quantidadeAlertasNaoLidas = useAlertaStore((state) => state.getQuantidadeAlertasNaoLidas());
  
  return (
    <div className="fixed top-0 left-0 right-0 h-14 border-b bg-background px-4 flex items-center justify-between lg:hidden z-50">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="Mischa's Bakery Logo" className="h-6 w-6" />
          <span className="font-bold">Mischa's Bakery</span>
        </Link>
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
        <ThemeToggle className="scale-75" />
      </div>
    </div>
  );
};

export default MobileHeader;
