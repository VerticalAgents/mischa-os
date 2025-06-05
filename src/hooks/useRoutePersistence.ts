
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'rotaAtual';

export const useRoutePersistence = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasRestoredRef = useRef(false);
  const isInitialMount = useRef(true);

  // Salva a rota atual no localStorage sempre que a rota muda (exceto na primeira montagem)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Não salvar na primeira montagem para não sobrescrever a rota salva
    }
    
    // Não salvar rotas de autenticação
    if (location.pathname !== '/auth' && location.pathname !== '/login') {
      console.log('🔄 Salvando rota atual:', location.pathname);
      localStorage.setItem(ROUTE_STORAGE_KEY, location.pathname);
    }
  }, [location.pathname]);

  // Restaura a rota salva APENAS na inicialização do app (uma única vez)
  const restoreRoute = () => {
    // Se já restaurou uma vez, não fazer nada
    if (hasRestoredRef.current) {
      console.log('⚠️ Restauração já foi feita, ignorando');
      return;
    }

    const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
    console.log('🔍 Verificando rota salva:', { savedRoute, currentPath: location.pathname });
    
    // Se existe uma rota salva e não estamos já nela, navegar para ela
    if (savedRoute && savedRoute !== location.pathname && savedRoute !== '/auth' && savedRoute !== '/login') {
      console.log('🚀 Restaurando rota para:', savedRoute);
      hasRestoredRef.current = true;
      navigate(savedRoute, { replace: true });
    } else {
      console.log('✅ Mantendo rota atual:', location.pathname);
      hasRestoredRef.current = true;
    }
  };

  return { restoreRoute };
};
