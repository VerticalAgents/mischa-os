
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const agendamentos = useAgendamentoClienteStore(state => state.agendamentos);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced sync function para evitar chamadas excessivas
  const debouncedSync = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('🔄 Sincronizando expedição (debounced)');
      carregarPedidos();
    }, 300); // 300ms de debounce
  }, [carregarPedidos]);

  // Sincronizar apenas quando agendamentos mudarem efetivamente
  useEffect(() => {
    if (agendamentos.length > 0) {
      debouncedSync();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [agendamentos, debouncedSync]);

  return { carregarPedidos };
};
