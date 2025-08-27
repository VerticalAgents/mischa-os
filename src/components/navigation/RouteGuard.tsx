import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRouteProtection } from '@/hooks/useRouteProtection';

interface RouteGuardProps {
  children: ReactNode;
}

/**
 * Componente que protege globalmente contra redirecionamentos indevidos
 * Deve ser usado para envolver o conteúdo principal da aplicação
 */
export const RouteGuard = ({ children }: RouteGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const { forceProtect } = useRouteProtection({ 
    enabled: true, 
    debugMode: process.env.NODE_ENV === 'development' 
  });

  useEffect(() => {
    // Se o usuário está logado e não está em loading, proteger a rota atual
    if (user && !loading && location.pathname !== '/') {
      forceProtect();
    }
  }, [user, loading, location.pathname, forceProtect]);

  return <>{children}</>;
};