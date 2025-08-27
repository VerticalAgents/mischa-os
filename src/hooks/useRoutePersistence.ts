
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'lastVisitedRoute';
const EXCLUDED_ROUTES = ['/auth', '/login', '/', '/home'];

const shouldSaveRoute = (path: string): boolean => {
  return !EXCLUDED_ROUTES.includes(path) && !path.startsWith('/auth');
};

/**
 * Hook melhorado para persistência de rota
 * Agora apenas salva as rotas, sem fazer navegação automática
 */
export const useRoutePersistence = () => {
  const location = useLocation();
  const lastSavedRoute = useRef<string>('');

  // Salva a rota atual sempre que ela muda (exceto rotas excluídas)
  useEffect(() => {
    const currentPath = location.pathname + location.search + location.hash;
    
    // Só salva se for uma rota válida e diferente da última salva
    if (shouldSaveRoute(currentPath) && currentPath !== lastSavedRoute.current) {
      console.log('💾 RoutePersistence: Salvando rota:', currentPath);
      localStorage.setItem(ROUTE_STORAGE_KEY, currentPath);
      lastSavedRoute.current = currentPath;
    }
  }, [location.pathname, location.search, location.hash]);

  // Função para obter a rota salva
  const getSavedRoute = (): string | null => {
    return localStorage.getItem(ROUTE_STORAGE_KEY);
  };

  // Função para verificar se uma rota é válida para restauração
  const isValidSavedRoute = (route: string | null): boolean => {
    if (!route) return false;
    return !EXCLUDED_ROUTES.includes(route) && !route.startsWith('/auth');
  };

  // Limpar persistência quando necessário
  const clearRoutePersistence = () => {
    localStorage.removeItem(ROUTE_STORAGE_KEY);
    lastSavedRoute.current = '';
    console.log('🗑️ RoutePersistence: Persistência limpa');
  };

  return { 
    getSavedRoute, 
    isValidSavedRoute, 
    clearRoutePersistence 
  };
};
