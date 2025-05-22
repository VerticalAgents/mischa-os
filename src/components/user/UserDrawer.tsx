
import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogOut, User, Settings, HelpCircle, Lightbulb, Bell } from "lucide-react";

interface UserDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserDrawer({ isOpen, onOpenChange }: UserDrawerProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onOpenChange(false);
  };

  const userData = {
    name: "Admin",
    email: "admin@mischasbakery.com",
    avatarUrl: undefined // Se tiver uma URL de avatar, pode ser definida aqui
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[320px] sm:w[360px]">
        <SheetHeader>
          <SheetTitle>Minha Conta</SheetTitle>
          <SheetDescription>
            Gerenciar suas configurações de usuário e acesso
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {userData.avatarUrl ? (
                <AvatarImage src={userData.avatarUrl} alt={userData.name} />
              ) : (
                <AvatarFallback className="text-lg">{userData.name.charAt(0)}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-medium text-lg">{userData.name}</h3>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to="/configuracoes?tab=usuario">
              <User className="mr-2 h-4 w-4" />
              Meus dados
            </Link>
          </Button>
          
          <Button variant="outline" className="w-full justify-start" asChild>
            <Link to="/configuracoes">
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </Link>
          </Button>
          
          <Separator className="my-4" />
          
          <Button variant="outline" className="w-full justify-start">
            <HelpCircle className="mr-2 h-4 w-4" />
            Central de Ajuda
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Lightbulb className="mr-2 h-4 w-4" />
            Portal de Ideias
          </Button>
          
          <Button variant="outline" className="w-full justify-start">
            <Bell className="mr-2 h-4 w-4" />
            Atualizações
          </Button>
        </div>
        
        <SheetFooter className="mt-6">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
