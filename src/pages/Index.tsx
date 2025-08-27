
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Só executa lógica de redirecionamento se não está carregando
    if (!loading) {
      if (user) {
        // Usuário logado - só redireciona se estiver na rota raiz
        if (location.pathname === '/') {
          // Verificar se há uma rota salva válida
          const savedRoute = localStorage.getItem('lastVisitedRoute');
          
          if (savedRoute && 
              savedRoute !== '/' && 
              savedRoute !== '/home' && 
              !savedRoute.startsWith('/auth') &&
              !savedRoute.startsWith('/login')) {
            console.log('🔄 Restaurando rota salva:', savedRoute);
            navigate(savedRoute, { replace: true });
          } else {
            // Se não há rota salva válida, vai para home
            navigate('/home', { replace: true });
          }
        }
        // Se já está em uma rota específica (não '/'), não faz nada - MANTÉM a rota atual
      } else {
        // Usuário não logado - sempre vai para auth
        navigate('/auth', { replace: true });
      }
    }
  }, [user, loading, navigate, location.pathname]);

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
