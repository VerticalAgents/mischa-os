import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle } from "lucide-react";
import { useUserRoles } from '@/hooks/useUserRoles';
import { useAuth } from '@/contexts/AuthContext';

interface PinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (success: boolean) => void;
  title?: string;
  description?: string;
}

export function PinDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Verificação de Administrador",
  description = "Esta ação requer privilégios de administrador."
}: PinDialogProps) {
  const { isAdmin, loading } = useUserRoles();
  const { isAuthenticated } = useAuth();
  const [checking, setChecking] = useState(false);

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      onConfirm(false);
      onClose();
      return;
    }

    setChecking(true);
    
    try {
      const hasAdminAccess = isAdmin();
      onConfirm(hasAdminAccess);
      
      if (!hasAdminAccess) {
        // Keep dialog open to show error
        return;
      }
      
      onClose();
    } catch (error) {
      console.error('Error checking admin access:', error);
      onConfirm(false);
    } finally {
      setChecking(false);
    }
  };

  const handleCancel = () => {
    onConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isAuthenticated && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você precisa estar logado para realizar esta ação.
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && !loading && !isAdmin() && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você não tem permissões de administrador para realizar esta ação.
              </AlertDescription>
            </Alert>
          )}

          {isAuthenticated && !loading && isAdmin() && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Você tem permissões de administrador. Clique em "Confirmar" para continuar.
              </AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Verificando permissões...</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isAuthenticated || loading || checking || !isAdmin()}
          >
            {checking ? 'Verificando...' : 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
