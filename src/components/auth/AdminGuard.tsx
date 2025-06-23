
import React, { ReactNode } from 'react';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { isAdmin, loading, error } = useUserRoles();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao verificar permissões: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!isAdmin()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para acessar esta funcionalidade. Apenas administradores podem realizar esta ação.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
