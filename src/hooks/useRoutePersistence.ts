
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const LEGACY_KEY = 'lastVisitedRoute';

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const ROUTE_STORAGE_KEY = user?.id ? `${LEGACY_KEY}:${user.id}` : LEGACY_KEY;

  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    
    // Não salvar rotas de autenticação, root vazia ou rotas inválidas
    if (currentPath !== '/auth' && 
        currentPath !== '/login' && 
        currentPath !== '/' && 
        currentPath !== '/home' &&
        !currentPath.startsWith('/auth')) {
      localStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
    }
  }, [location.pathname, location.search, location.hash, ROUTE_STORAGE_KEY]);

  // Restaura a rota salva apenas quando solicitado
  const restoreRoute = () => {
    // Tenta nova chave por usuário; se não existir, usa legado
    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY) 
      || localStorage.getItem(LEGACY_KEY);
    const currentPath = location.pathname + location.search + location.hash;
    
    // Se existe uma rota salva e é diferente da atual
    if (savedRoute && 
        savedRoute !== currentPath && 
        savedRoute !== '/auth' && 
        savedRoute !== '/login' && 
        savedRoute !== '/' &&
        savedRoute !== '/home' &&
        !savedRoute.startsWith('/auth')) {
      
      navigate(savedRoute, { replace: true });
      return true;
    }
    
    return false;
  };

  const clearRoutePersistence = () => {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  };

  return {
    restoreRoute,
    clearRoutePersistence
  };
};
