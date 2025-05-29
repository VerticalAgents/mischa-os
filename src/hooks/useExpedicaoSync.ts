
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const agendamentos = useAgendamentoClienteStore(state => state.agendamentos);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAgendamentosLength = useRef(0);
  const lastSyncTimestamp = useRef(0);
  const hasInitialLoad = useRef(false);

  // Debounced sync function
  const debouncedSync = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const now = Date.now();
      // Reduzir tempo mínimo entre sincronizações para 1 segundo
      if (now - lastSyncTimestamp.current > 1000) {
        console.log('🔄 Sincronizando expedição (debounced)');
        lastSyncTimestamp.current = now;
        carregarPedidos();
      } else {
        console.log('⏭️ Pulando sincronização - muito recente');
      }
    }, 500); // Reduzir debounce para 500ms
  }, [carregarPedidos]);

  // Carregar dados inicialmente quando o componente monta
  useEffect(() => {
    if (!hasInitialLoad.current) {
      console.log('🚀 Carregamento inicial da expedição');
      hasInitialLoad.current = true;
      carregarPedidos();
    }
  }, [carregarPedidos]);

  // Sincronizar quando agendamentos mudarem
  useEffect(() => {
    const currentLength = agendamentos.length;
    const hasRealChange = currentLength !== lastAgendamentosLength.current;
    
    if (hasRealChange || currentLength > 0) {
      console.log('📊 Mudança detectada nos agendamentos:', {
        anterior: lastAgendamentosLength.current,
        atual: currentLength,
        hasRealChange
      });
      
      lastAgendamentosLength.current = currentLength;
      debouncedSync();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [agendamentos.length, debouncedSync]);

  return { carregarPedidos };
};
