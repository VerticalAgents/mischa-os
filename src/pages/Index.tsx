
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRoutePersistence } from '@/hooks/useRoutePersistence';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Index() {
  const { user, loading } = useAuth();
  const { restoreRoute } = useRoutePersistence();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Usuário logado
        if (location.pathname === '/') {
          // Só tenta restaurar se estivermos na rota raiz
          const routeRestored = restoreRoute();
          if (!routeRestored) {
            // Se não conseguiu restaurar nenhuma rota, vai para a última rota salva ou home
            const savedRoute = localStorage.getItem('lastVisitedRoute');
            if (savedRoute && savedRoute !== '/' && savedRoute !== '/home' && !savedRoute.startsWith('/auth')) {
              navigate(savedRoute, { replace: true });
            } else {
              navigate('/home', { replace: true });
            }
          }
        }
        // Se já estamos em uma rota específica, não faz nada - MANTÉM a rota atual
      } else {
        // Usuário não logado, vai para auth
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, navigate, restoreRoute, location.pathname]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return null;
}
