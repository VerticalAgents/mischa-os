
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserRoles } from '@/hooks/useUserRoles';

export default function Index() {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Previne múltiplos redirecionamentos
    if (hasRedirectedRef.current || loading || roleLoading) return;

    const currentPath = location.pathname + location.search + location.hash;

    if (user) {
      // Representante: portal dedicado
      if (userRole === 'representante') {
        hasRedirectedRef.current = true;
        navigate('/rep/home', { replace: true });
        return;
      }

      // Usuário logado
      if (currentPath === '/') {
        // Só redireciona se estiver na rota raiz
        const savedRoute = localStorage.getItem('lastVisitedRoute');
        
        if (savedRoute && isValidRoute(savedRoute)) {
          console.log('🔄 Index: Restaurando rota salva:', savedRoute);
          hasRedirectedRef.current = true;
          navigate(savedRoute, { replace: true });
          return;
        }
        
        // Se não há rota salva válida, vai para home
        console.log('🏠 Index: Indo para home');
        hasRedirectedRef.current = true;
        navigate('/home', { replace: true });
      }
      // Se já está em uma rota específica, NÃO faz nada - mantém a rota atual
    } else {
      // Usuário não logado - sempre vai para auth
      console.log('🔐 Index: Usuário não logado, indo para auth');
      hasRedirectedRef.current = true;
      navigate('/auth', { replace: true });
    }
  }, [user, loading, userRole, roleLoading, navigate, location.pathname, location.search, location.hash]);

  // Reset do flag quando a rota muda
  useEffect(() => {
    hasRedirectedRef.current = false;
  }, [location.pathname]);

  // Mostrar loading apenas enquanto verifica autenticação
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

// Função para validar se uma rota é válida para restauração
const isValidRoute = (route: string): boolean => {
  if (!route) return false;
  
  // Rotas que não devem ser restauradas
  const excludedRoutes = ['/', '/home', '/auth', '/login'];
  
  return !excludedRoutes.includes(route) && 
         !route.startsWith('/auth') && 
         !route.startsWith('/login');
};
