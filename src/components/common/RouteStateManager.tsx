import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRoutePersistence } from '@/hooks/useRoutePersistence';

/**
 * Componente para gerenciar o estado das rotas e tabs
 * Sincroniza a persistência de rota com a persistência de tabs
 */
export const RouteStateManager = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { } = useRoutePersistence(); // Apenas usar o hook para salvar automaticamente

  useEffect(() => {
    // Se o usuário está logado, salvar também a aba ativa se existe
    if (user && location.pathname !== '/') {
      // Verificar se há parâmetros de aba na URL
      const urlParams = new URLSearchParams(location.search);
      const activeTab = urlParams.get('tab');
      
      if (activeTab) {
        // Salvar a aba junto com a rota
        const tabKey = `${location.pathname}-activeTab`;
        localStorage.setItem(tabKey, activeTab);
      }
    }
  }, [location.pathname, location.search, user]);

  return null; // Este componente não renderiza nada
};