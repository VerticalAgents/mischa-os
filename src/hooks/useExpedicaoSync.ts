
import { useEffect } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';

export const useExpedicaoSync = () => {
  const carregarPedidos = useExpedicaoStore(state => state.carregarPedidos);
  const agendamentos = useAgendamentoClienteStore(state => state.agendamentos);

  // Sincronizar expedição sempre que os agendamentos mudarem
  useEffect(() => {
    console.log('🔄 Sincronizando expedição com agendamentos atualizados');
    carregarPedidos();
  }, [agendamentos, carregarPedidos]);

  return { carregarPedidos };
};
