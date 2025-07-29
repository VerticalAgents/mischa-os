
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';

interface SessionExpiredDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SessionExpiredDialog({ isOpen, onClose }: SessionExpiredDialogProps) {
  const { refreshSession } = useAuth();

  const handleRefresh = async () => {
    try {
      await refreshSession();
      onClose();
    } catch (error) {
      console.error('Erro ao renovar sessão:', error);
      // Force logout if refresh fails
      window.location.href = '/login';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sessão Expirada</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão expirou. Clique em "Renovar Sessão" para continuar usando o sistema
            ou será redirecionado para a página de login.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleRefresh}>
            Renovar Sessão
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
