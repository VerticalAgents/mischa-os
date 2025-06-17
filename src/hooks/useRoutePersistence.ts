
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'lastVisitedRoute';

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salva a rota atual sempre que ela muda (exceto rotas de auth)
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Não salvar rotas de autenticação ou root vazia
    if (currentPath !== '/auth' && currentPath !== '/login' && currentPath !== '/') {
      console.log('🔄 Salvando rota atual:', currentPath);
      localStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
    }
  }, [location.pathname, location.search]);

  // Restaura a rota salva apenas na inicialização
  const restoreRoute = () => {
    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    const currentPath = location.pathname + location.search;
    
    console.log('🔍 Verificando rota salva:', { savedRoute, currentPath });
    
    // Se existe uma rota salva, não estamos nela, e não é uma rota de auth
    if (savedRoute && 
        savedRoute !== currentPath && 
        savedRoute !== '/auth' && 
        savedRoute !== '/login' && 
        savedRoute !== '/' &&
        currentPath === '/') {
      
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
