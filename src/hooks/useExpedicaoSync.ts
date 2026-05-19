
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
      
      // Timeout aumentado para evitar conflitos com otimizações
      const timeoutId = setTimeout(() => {
        carregarPedidos().catch(error => {
          console.error('Erro no carregamento inicial:', error);
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [carregarPedidos]);

  return { carregarPedidos, recarregarDados };
};
