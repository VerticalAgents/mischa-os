
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const hasInitialLoad = useRef(false);

  // Carregamento inicial simples - sem sincronizações complexas
  useEffect(() => {
    if (!hasInitialLoad.current) {
      console.log('🚀 Carregamento inicial da expedição');
      hasInitialLoad.current = true;
      
      // Timeout simples para evitar conflitos
      const timeoutId = setTimeout(() => {
        carregarPedidos().catch(error => {
          console.error('Erro no carregamento inicial:', error);
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [carregarPedidos]);

  return { carregarPedidos };
};
