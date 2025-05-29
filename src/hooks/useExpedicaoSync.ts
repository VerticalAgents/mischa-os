
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
  const isSyncingRef = useRef(false);

  // Debounced sync function - CORRIGIDO para evitar loops
  const debouncedSync = useCallback(() => {
    // Evitar múltiplas sincronizações simultâneas
    if (isSyncingRef.current) {
      console.log('⏭️ Sincronização já em andamento, pulando...');
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(async () => {
      const now = Date.now();
      // Aumentar tempo mínimo entre sincronizações para 3 segundos
      if (now - lastSyncTimestamp.current > 3000) {
        console.log('🔄 === SINCRONIZAÇÃO EXPEDIÇÃO (DEBOUNCED) ===');
        console.log('🔄 Quantidade de agendamentos:', agendamentos.length);
        
        isSyncingRef.current = true;
        lastSyncTimestamp.current = now;
        
        try {
          await carregarPedidos();
        } catch (error) {
          console.error('❌ Erro na sincronização:', error);
        } finally {
          isSyncingRef.current = false;
        }
      } else {
        console.log('⏭️ Pulando sincronização - muito recente');
      }
    }, 1000); // Aumentar debounce para 1 segundo
  }, [carregarPedidos]); // REMOVIDO agendamentos.length da dependência

  // Carregar dados inicialmente quando o componente monta - SIMPLIFICADO
  useEffect(() => {
    if (!hasInitialLoad.current && !isSyncingRef.current) {
      console.log('🚀 === CARREGAMENTO INICIAL DA EXPEDIÇÃO ===');
      hasInitialLoad.current = true;
      isSyncingRef.current = true;
      
      carregarPedidos().finally(() => {
        isSyncingRef.current = false;
      });
    }
  }, [carregarPedidos]);

  // Sincronizar quando agendamentos mudarem - CORRIGIDO
  useEffect(() => {
    const currentLength = agendamentos.length;
    const hasRealChange = currentLength !== lastAgendamentosLength.current;
    
    // Só processar se houve mudança real E não estamos carregando inicialmente
    if (hasRealChange && hasInitialLoad.current && !isSyncingRef.current) {
      console.log('📊 === VERIFICAÇÃO DE MUDANÇAS ===');
      console.log('📊 Agendamentos anterior:', lastAgendamentosLength.current);
      console.log('📊 Agendamentos atual:', currentLength);
      console.log('📊 Disparando sincronização...');
      
      lastAgendamentosLength.current = currentLength;
      debouncedSync();
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [agendamentos.length, debouncedSync]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      isSyncingRef.current = false;
    };
  }, []);

  return { carregarPedidos };
};
