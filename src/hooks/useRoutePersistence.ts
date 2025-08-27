
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'lastVisitedRoute';

// Lista de rotas que não devem ser salvas
const EXCLUDED_ROUTES = ['/auth', '/login', '/', '/home'];

const shouldSaveRoute = (path: string): boolean => {
  return !EXCLUDED_ROUTES.includes(path) && !path.startsWith('/auth');
};

const shouldRestoreRoute = (route: string): boolean => {
  return route && 
         !EXCLUDED_ROUTES.includes(route) && 
         !route.startsWith('/auth');
};

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salva a rota atual sempre que ela muda (exceto rotas excluídas)
  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    
    if (shouldSaveRoute(currentPath)) {
      console.log('🔄 Salvando rota atual:', currentPath);
      localStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
    }
  }, [location.pathname, location.search, location.hash]);

  // Restaura a rota salva apenas quando solicitado
  const restoreRoute = () => {
    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    const currentPath = location.pathname + location.search + location.hash;
    
    console.log('🔍 Verificando rota salva:', { savedRoute, currentPath });
    
    // Se existe uma rota salva válida e é diferente da atual
    if (savedRoute && 
        savedRoute !== currentPath && 
        shouldRestoreRoute(savedRoute)) {
      
      console.log('🚀 Restaurando rota para:', savedRoute);
      navigate(savedRoute, { replace: true });
      return true;
    }
    
    console.log('✅ Mantendo rota atual:', currentPath);
    return false;
  };

  // Limpar persistência quando necessário
  const clearRoutePersistence = () => {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
  };

  return { restoreRoute, clearRoutePersistence };
};
