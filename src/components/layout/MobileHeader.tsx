
import { Link } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAlertaStore } from "@/hooks/useAlertaStore";
import mischasLogo from "@/assets/mischas-logo.png";

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
    <div 
      className="fixed top-0 left-0 right-0 h-14 border-b px-4 flex items-center justify-between lg:hidden z-50"
      style={{ backgroundColor: '#d1193a', borderColor: 'rgba(255,255,255,0.2)' }}
    >
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center space-x-2">
          <img src={mischasLogo} alt="Mischa's Bakery Logo" className="h-8 w-8 rounded-full border-2 border-white object-cover" />
          <span className="font-bold text-white">MISCHA'S BAKERY</span>
        </Link>
      </div>
      <div className="flex items-center space-x-2">
        <Link to="/alertas">
          <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20">
            <Bell className="h-5 w-5" />
            {quantidadeAlertasNaoLidas > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-white text-[#d1193a]">
                {quantidadeAlertasNaoLidas}
              </Badge>
            )}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default MobileHeader;
