
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';

// FASE 4: Throttle helper
const throttle = (func: Function, limit: number) => {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
};

// FASE 4: Debounce helper
const debounce = (func: Function, delay: number) => {
  let debounceTimer: NodeJS.Timeout;
  return function(this: any, ...args: any[]) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  }
};

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const hasInitialLoad = useRef(false);
  // FASE 4: Ref para controlar instância única
  const syncRef = useRef(false);

  // FASE 2: Memoizar função de recarga com useCallback
  const recarregarDados = useCallback(async () => {
    // FASE 4: Evitar múltiplas execuções simultâneas
    if (syncRef.current) {
      console.log('🔄 Sincronização já em andamento, ignorando nova solicitação');
      return;
    }

    syncRef.current = true;
    console.log('🔄 Recarregando dados da expedição...');
    
    try {
      await carregarPedidos();
      console.log('✅ Dados da expedição atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
    } finally {
      syncRef.current = false;
    }
  }, [carregarPedidos]);

  // FASE 2: Implementar debounce na função de recarga
  const recarregarDadosDebounced = useCallback(
    debounce(recarregarDados, 1000),
    [recarregarDados]
  );

  // FASE 2: Carregamento inicial com controle melhorado
  useEffect(() => {
    if (!hasInitialLoad.current) {
      console.log('🚀 Carregamento inicial da expedição');
      hasInitialLoad.current = true;
      
      // FASE 4: Timeout mais conservador para evitar conflitos
      const timeoutId = setTimeout(() => {
        if (!syncRef.current) {
          carregarPedidos().catch(error => {
            console.error('Erro no carregamento inicial:', error);
          });
        }
      }, 2000); // Aumentado de 1000 para 2000ms

      return () => clearTimeout(timeoutId);
    }
  }, [carregarPedidos]);

  // FASE 4: Implementar throttle no event listener de visibilidade
  const handleVisibilityChangeThrottled = useCallback(
    throttle(() => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Página voltou ao foco - recarregando dados (throttled)');
        recarregarDadosDebounced();
      }
    }, 5000), // Throttle de 5 segundos
    [recarregarDadosDebounced]
  );

  // FASE 4: Melhorar controle do event listener
  useEffect(() => {
    // FASE 4: Cleanup adequado e controle de instância
    let isActive = true;
    
    const handleVisibilityChange = () => {
      if (isActive) {
        handleVisibilityChangeThrottled();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      isActive = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('🧹 Event listener de visibilidade removido');
    };
  }, [handleVisibilityChangeThrottled]);

  return { 
    carregarPedidos, 
    recarregarDados: recarregarDadosDebounced // Retorna versão com debounce
  };
};
