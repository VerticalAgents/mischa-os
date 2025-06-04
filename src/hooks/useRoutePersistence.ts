
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'rotaAtual';

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestoredRef = useRef(false);

  // Salva a rota atual no localStorage sempre que a rota muda
  useEffect(() => {
    // Não salvar rotas de autenticação
    if (location.pathname !== '/auth' && location.pathname !== '/login') {
      localStorage.setItem(ROUTE_STORAGE_KEY, location.pathname);
    }
  }, [location.pathname]);

  // Restaura a rota salva APENAS na inicialização do app (uma única vez)
  const restoreRoute = () => {
    // Se já restaurou uma vez, não fazer nada
    if (hasRestoredRef.current) {
      return;
    }

    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    
    // Se existe uma rota salva e não estamos já nela, navegar para ela
    if (savedRoute && savedRoute !== location.pathname && savedRoute !== '/auth' && savedRoute !== '/login') {
      hasRestoredRef.current = true;
      navigate(savedRoute, { replace: true });
    } else {
      hasRestoredRef.current = true;
    }
  };

  return { restoreRoute };
};
