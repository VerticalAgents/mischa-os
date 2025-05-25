
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import UserDrawer from "@/components/user/UserDrawer";
import { useAuth } from "@/contexts/AuthContext";

export default function TopHeader() {
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);
  const { user } = useAuth();
  
  const userData = {
    name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Usuário",
    email: user?.email || "",
    avatarUrl: user?.user_metadata?.avatar_url
  };
  
  return (
    <div className="fixed top-0 right-0 z-50 px-4 py-2 flex items-center space-x-2">
      <ThemeToggle size="icon" variant="ghost" />
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full" 
        onClick={() => setIsUserDrawerOpen(true)}
      >
        <Avatar className="h-8 w-8">
          {userData.avatarUrl ? (
            <AvatarImage src={userData.avatarUrl} alt={userData.name} />
          ) : (
            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
          )}
        </Avatar>
      </Button>
      
      <UserDrawer 
        isOpen={isUserDrawerOpen} 
        onOpenChange={setIsUserDrawerOpen} 
      />
    </div>
  );
}
