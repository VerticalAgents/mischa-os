
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const agendamentos = useAgendamentoClienteStore(state => state.agendamentos);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAgendamentosLength = useRef(0);
  const lastSyncTimestamp = useRef(0);

  // Debounced sync function com maior debounce para evitar loops
  const debouncedSync = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      const now = Date.now();
      // Evitar sincronizações muito frequentes (mínimo 3 segundos entre calls)
      if (now - lastSyncTimestamp.current > 3000) {
        console.log('🔄 Sincronizando expedição (debounced)');
        lastSyncTimestamp.current = now;
        carregarPedidos();
      } else {
        console.log('⏭️ Pulando sincronização - muito recente');
      }
    }, 1000); // Debounce de 1 segundo
  }, [carregarPedidos]);

  // Sincronizar apenas quando agendamentos mudarem efetivamente
  useEffect(() => {
    // Verificar se realmente houve mudança significativa
    const currentLength = agendamentos.length;
    const hasRealChange = currentLength !== lastAgendamentosLength.current;
    
    if (agendamentos.length > 0 && hasRealChange) {
      console.log('📊 Mudança detectada nos agendamentos:', {
        anterior: lastAgendamentosLength.current,
        atual: currentLength
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
