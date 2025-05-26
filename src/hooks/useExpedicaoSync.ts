
import { useEffect, useRef, useCallback } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const agendamentos = useAgendamentoClienteStore(state => state.agendamentos);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAgendamentosLength = useRef(0);

  // Debounced sync function para evitar chamadas excessivas
  const debouncedSync = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('🔄 Sincronizando expedição (debounced)');
      carregarPedidos();
    }, 500); // Aumentado para 500ms de debounce
  }, [carregarPedidos]);

  // Sincronizar apenas quando agendamentos mudarem efetivamente de quantidade
  useEffect(() => {
    // Verificar se realmente houve mudança no número de agendamentos
    if (agendamentos.length > 0 && agendamentos.length !== lastAgendamentosLength.current) {
      console.log('📊 Mudança detectada nos agendamentos:', {
        anterior: lastAgendamentosLength.current,
        atual: agendamentos.length
      });
      
      lastAgendamentosLength.current = agendamentos.length;
      debouncedSync();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [agendamentos.length, debouncedSync]); // Apenas reagir à mudança de tamanho

  return { carregarPedidos };
};
