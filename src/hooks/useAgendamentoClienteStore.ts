
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AgendamentoClienteStore } from './agendamento/types';
import { createAgendamentoActions } from './agendamento/actions';

export type { AgendamentoCliente } from './agendamento/types';

export const useAgendamentoClienteStore = create<AgendamentoClienteStore>()(
  devtools(
    (set, get) => ({
      agendamentos: [],
      agendamentosCompletos: new Map(),
      loading: false,
      error: null,

      // Spread all actions from the actions module
      ...createAgendamentoActions(get, set),

      // Simple actions that don't need to be in separate file
      obterAgendamento: async (clienteId: string) => {
        return get().carregarAgendamentoPorCliente(clienteId);
      },

      limparErro: () => set((state: any) => ({ ...state, error: null }))
    }),
    { name: 'agendamento-cliente-store' }
  )
);
