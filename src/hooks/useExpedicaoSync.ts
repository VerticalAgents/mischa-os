
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const hasInitialLoad = useRef(false);

  // Função de recarga de dados que pode ser chamada sempre que necessário
  const recarregarDados = useCallback(async () => {
    console.log('🔄 Recarregando dados da expedição...');
    try {
      await carregarPedidos();
      console.log('✅ Dados da expedição atualizados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao recarregar dados:', error);
    }
  }, [carregarPedidos]);

  // Carregamento inicial 
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

  // Adicionar efeito para recarregar dados quando a página de expedição estiver visível/em foco
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        recarregarDados();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [recarregarDados]);

  return { carregarPedidos, recarregarDados };
};
