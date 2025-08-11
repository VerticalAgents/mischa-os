
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'lastVisitedRoute';

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salva a rota atual sempre que ela muda (exceto rotas de auth)
  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    
    // Não salvar rotas de autenticação, root vazia ou rotas inválidas
    if (currentPath !== '/auth' && 
        currentPath !== '/login' && 
        currentPath !== '/' && 
        currentPath !== '/home' &&
        !currentPath.startsWith('/auth')) {
      console.log('🔄 Salvando rota atual:', currentPath);
      localStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
    }
  }, [location.pathname, location.search, location.hash]);

  // Restaura a rota salva apenas quando solicitado
  const restoreRoute = () => {
    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    const currentPath = location.pathname + location.search + location.hash;
    
    console.log('🔍 Verificando rota salva:', { savedRoute, currentPath });
    
    // Se existe uma rota salva e é diferente da atual
    if (savedRoute && 
        savedRoute !== currentPath && 
        savedRoute !== '/auth' && 
        savedRoute !== '/login' && 
        savedRoute !== '/' &&
        savedRoute !== '/home' &&
        !savedRoute.startsWith('/auth')) {
      
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
