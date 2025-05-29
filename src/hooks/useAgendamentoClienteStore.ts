
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
  carregarAgendamentoPorCliente: (clienteId: string) => Promise<AgendamentoCliente | null>;
  obterAgendamento: (clienteId: string) => Promise<AgendamentoCliente | null>;
  salvarAgendamento: (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => Promise<void>;
  criarAgendamentoSeNaoExiste: (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => Promise<void>;
  limparErro: () => void;
}

// Helper function to convert database row to AgendamentoCliente
const convertDbRowToAgendamento = (row: any): AgendamentoCliente => {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    tipo_pedido: row.tipo_pedido as 'Padrão' | 'Alterado',
    status_agendamento: row.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
    data_proxima_reposicao: row.data_proxima_reposicao ? new Date(row.data_proxima_reposicao) : undefined,
    quantidade_total: row.quantidade_total,
    itens_personalizados: row.itens_personalizados as { produto: string; quantidade: number }[] | undefined,
    substatus_pedido: row.substatus_pedido,
    created_at: row.created_at ? new Date(row.created_at) : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
  };
};

// Helper function to convert AgendamentoCliente to database format
const convertAgendamentoToDbFormat = (agendamento: Partial<AgendamentoCliente>) => {
  const dbData: any = {};
  
  if (agendamento.cliente_id) dbData.cliente_id = agendamento.cliente_id;
  if (agendamento.tipo_pedido) dbData.tipo_pedido = agendamento.tipo_pedido;
  if (agendamento.status_agendamento) dbData.status_agendamento = agendamento.status_agendamento;
  if (agendamento.data_proxima_reposicao) dbData.data_proxima_reposicao = agendamento.data_proxima_reposicao.toISOString().split('T')[0];
  if (agendamento.quantidade_total !== undefined) dbData.quantidade_total = agendamento.quantidade_total;
  if (agendamento.itens_personalizados !== undefined) dbData.itens_personalizados = agendamento.itens_personalizados;
  if (agendamento.substatus_pedido) dbData.substatus_pedido = agendamento.substatus_pedido;
  if (agendamento.created_at) dbData.created_at = agendamento.created_at.toISOString();
  if (agendamento.updated_at) dbData.updated_at = agendamento.updated_at.toISOString();
  
  return dbData;
};

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

          const agendamentosConvertidos = data?.map(convertDbRowToAgendamento) || [];
          console.log('useAgendamentoClienteStore: Agendamentos carregados:', agendamentosConvertidos.length);
          set({ agendamentos: agendamentosConvertidos, loading: false });
        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido', loading: false });
        }
      },

      carregarAgendamentoPorCliente: async (clienteId: string) => {
        try {
          console.log('useAgendamentoClienteStore: Carregando agendamento para cliente:', clienteId);
          
          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('cliente_id', clienteId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('useAgendamentoClienteStore: Erro ao carregar agendamento:', error);
            throw error;
          }

          const agendamento = data ? convertDbRowToAgendamento(data) : null;
          console.log('useAgendamentoClienteStore: Agendamento carregado:', agendamento);
          return agendamento;
        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro ao carregar agendamento:', error);
          return null;
        }
      },

      obterAgendamento: async (clienteId: string) => {
        return get().carregarAgendamentoPorCliente(clienteId);
      },

      salvarAgendamento: async (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => {
        try {
          console.log('useAgendamentoClienteStore: Salvando agendamento para cliente:', clienteId, dadosAgendamento);
          
          // Verificar se o agendamento já existe
          const agendamentoExistente = await get().obterAgendamento(clienteId);
          
          const dadosParaSalvar = {
            cliente_id: clienteId,
            ...convertAgendamentoToDbFormat(dadosAgendamento),
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
          
          // Converter o resultado do banco para o formato da interface
          const agendamentoConvertido = convertDbRowToAgendamento(result.data);
          
          // Atualizar o estado local
          set(state => ({
            agendamentos: agendamentoExistente
              ? state.agendamentos.map(a => a.cliente_id === clienteId ? agendamentoConvertido : a)
              : [...state.agendamentos, agendamentoConvertido]
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
