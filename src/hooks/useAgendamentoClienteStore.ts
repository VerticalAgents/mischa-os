
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgendamentoCliente {
  id?: string;
  cliente_id: string;
  tipo_pedido: 'Padrão' | 'Alterado';
  status_agendamento: 'Agendar' | 'Previsto' | 'Agendado';
  data_proxima_reposicao?: Date;
  quantidade_total: number;
  itens_personalizados?: { produto: string; quantidade: number }[];
  substatus_pedido?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface AgendamentoClienteStore {
  agendamentos: AgendamentoCliente[];
  loading: boolean;
  error: string | null;
  
  // Actions
  carregarTodosAgendamentos: () => Promise<void>;
  obterAgendamento: (clienteId: string) => Promise<AgendamentoCliente | null>;
  salvarAgendamento: (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => Promise<void>;
  criarAgendamentoSeNaoExiste: (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => Promise<void>;
  limparErro: () => void;
}

export const useAgendamentoClienteStore = create<AgendamentoClienteStore>()(
  devtools(
    (set, get) => ({
      agendamentos: [],
      loading: false,
      error: null,

      carregarTodosAgendamentos: async () => {
        set({ loading: true, error: null });
        try {
          console.log('useAgendamentoClienteStore: Carregando todos os agendamentos...');
          
          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select('*');

          if (error) {
            console.error('useAgendamentoClienteStore: Erro ao carregar agendamentos:', error);
            throw error;
          }

          console.log('useAgendamentoClienteStore: Agendamentos carregados:', data?.length || 0);
          set({ agendamentos: data || [], loading: false });
        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido', loading: false });
        }
      },

      obterAgendamento: async (clienteId: string) => {
        try {
          console.log('useAgendamentoClienteStore: Obtendo agendamento para cliente:', clienteId);
          
          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('cliente_id', clienteId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('useAgendamentoClienteStore: Erro ao obter agendamento:', error);
            throw error;
          }

          console.log('useAgendamentoClienteStore: Agendamento obtido:', data);
          return data || null;
        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro ao obter agendamento:', error);
          return null;
        }
      },

      salvarAgendamento: async (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => {
        try {
          console.log('useAgendamentoClienteStore: Salvando agendamento para cliente:', clienteId, dadosAgendamento);
          
          // Verificar se o agendamento já existe
          const agendamentoExistente = await get().obterAgendamento(clienteId);
          
          const dadosParaSalvar = {
            cliente_id: clienteId,
            ...dadosAgendamento,
            updated_at: new Date().toISOString()
          };

          let result;
          if (agendamentoExistente) {
            // Atualizar agendamento existente, preservando dados anteriores se não especificados
            const dadosAtualizacao = {
              ...dadosParaSalvar,
              // Preservar tipo de pedido anterior se não especificado
              tipo_pedido: dadosAgendamento.tipo_pedido || agendamentoExistente.tipo_pedido,
              // Preservar itens personalizados anteriores se não especificados
              itens_personalizados: dadosAgendamento.itens_personalizados !== undefined 
                ? dadosAgendamento.itens_personalizados 
                : agendamentoExistente.itens_personalizados
            };
            
            console.log('useAgendamentoClienteStore: Atualizando agendamento existente com preservação:', dadosAtualizacao);
            
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .update(dadosAtualizacao)
              .eq('cliente_id', clienteId)
              .select()
              .single();
            
            result = { data, error };
          } else {
            // Criar novo agendamento
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .insert({
                ...dadosParaSalvar,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            
            result = { data, error };
          }

          if (result.error) {
            console.error('useAgendamentoClienteStore: Erro ao salvar agendamento:', result.error);
            throw result.error;
          }

          console.log('useAgendamentoClienteStore: Agendamento salvo com sucesso:', result.data);
          
          // Atualizar o estado local
          set(state => ({
            agendamentos: agendamentoExistente
              ? state.agendamentos.map(a => a.cliente_id === clienteId ? result.data : a)
              : [...state.agendamentos, result.data]
          }));

          // Atualizar também os dados do cliente na store de clientes
          const { useClienteStore } = await import('./useClienteStore');
          const clienteStore = useClienteStore.getState();
          
          clienteStore.atualizarCliente(clienteId, {
            statusAgendamento: dadosAgendamento.status_agendamento,
            proximaDataReposicao: dadosAgendamento.data_proxima_reposicao
          });

        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro ao salvar agendamento:', error);
          toast.error('Erro ao salvar agendamento');
          throw error;
        }
      },

      criarAgendamentoSeNaoExiste: async (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => {
        const agendamentoExistente = await get().obterAgendamento(clienteId);
        
        if (!agendamentoExistente) {
          await get().salvarAgendamento(clienteId, dadosIniciais);
        }
      },

      limparErro: () => set({ error: null })
    }),
    { name: 'agendamento-cliente-store' }
  )
);
