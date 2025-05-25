
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface UserDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserDrawer({ isOpen, onOpenChange }: UserDrawerProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário",
    email: user?.email || "",
    avatarUrl: user?.user_metadata?.avatar_url
  };

  const handleConfigClick = () => {
    onOpenChange(false);
    navigate('/configuracoes');
  };

  const handleLogout = () => {
    onOpenChange(false);
    logout();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="text-left">Minha Conta</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          {/* User Info */}
          <div className="flex items-center space-x-4 p-4 rounded-lg bg-muted/50">
            <Avatar className="h-12 w-12">
              {userData.avatarUrl ? (
                <AvatarImage src={userData.avatarUrl} alt={userData.name} />
              ) : (
                <AvatarFallback className="text-lg">
                  {userData.name.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{userData.name}</p>
              <p className="text-sm text-muted-foreground truncate">{userData.email}</p>
              <p className="text-xs text-muted-foreground">Conectado via Google</p>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Menu Options */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleConfigClick}
            >
              <Settings className="mr-3 h-4 w-4" />
              Configurações
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sair do Sistema
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
