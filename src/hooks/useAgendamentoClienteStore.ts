import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AgendamentoCliente {
  id: string;
  cliente_id: string;
  status_agendamento: 'Agendar' | 'Previsto' | 'Agendado';
  data_proxima_reposicao?: Date;
  quantidade_total: number;
  tipo_pedido: 'Padrão' | 'Alterado';
  itens_personalizados?: Array<{ produto: string; quantidade: number }>;
  created_at: Date;
  updated_at: Date;
}

interface AgendamentoClienteStore {
  agendamentos: AgendamentoCliente[];
  loading: boolean;
  
  // Actions
  carregarAgendamentoPorCliente: (clienteId: string) => Promise<AgendamentoCliente | null>;
  salvarAgendamento: (clienteId: string, dados: Partial<AgendamentoCliente>) => Promise<void>;
  removerAgendamento: (clienteId: string) => Promise<void>;
  criarAgendamentoPadrao: (clienteId: string) => Promise<AgendamentoCliente>;
  carregarTodosAgendamentos: () => Promise<void>; // New method to load all schedules
  atualizarAgendamentoLocal: (agendamento: AgendamentoCliente) => void; // New method for local updates
}

// Helper para converter data local para formato de data sem timezone
const formatDateForDatabase = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para converter string de data do banco para Date local
const parseDateFromDatabase = (dateString: string): Date => {
  // Parse a data como local, sem considerar timezone
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const useAgendamentoClienteStore = create<AgendamentoClienteStore>()(
  devtools(
    (set, get) => ({
      agendamentos: [],
      loading: false,
      
      carregarTodosAgendamentos: async () => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .order('updated_at', { ascending: false });

          if (error) {
            console.error('Erro ao carregar todos os agendamentos:', error);
            return;
          }

          const agendamentosConvertidos = data?.map(item => ({
            id: item.id,
            cliente_id: item.cliente_id,
            status_agendamento: item.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
            data_proxima_reposicao: item.data_proxima_reposicao ? parseDateFromDatabase(item.data_proxima_reposicao) : undefined,
            quantidade_total: item.quantidade_total,
            tipo_pedido: item.tipo_pedido as 'Padrão' | 'Alterado',
            itens_personalizados: item.itens_personalizados as Array<{ produto: string; quantidade: number }> | undefined,
            created_at: new Date(item.created_at),
            updated_at: new Date(item.updated_at)
          })) || [];

          set({ agendamentos: agendamentosConvertidos });
        } catch (error) {
          console.error('Erro ao carregar todos os agendamentos:', error);
        } finally {
          set({ loading: false });
        }
      },

      atualizarAgendamentoLocal: (agendamento: AgendamentoCliente) => {
        set(state => ({
          agendamentos: state.agendamentos.map(item => 
            item.cliente_id === agendamento.cliente_id ? agendamento : item
          )
        }));
      },

      carregarAgendamentoPorCliente: async (clienteId: string) => {
        set({ loading: true });
        try {
          console.log('Carregando agendamento para cliente:', clienteId);
          
          // Primeiro, verificar se o cliente existe na tabela clientes
          const { data: clienteData, error: clienteError } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', clienteId)
            .maybeSingle();

          if (clienteError) {
            console.error('Erro ao verificar cliente:', clienteError);
            toast({
              title: "Erro",
              description: "Não foi possível verificar o cliente",
              variant: "destructive"
            });
            return null;
          }

          if (!clienteData) {
            console.error('Cliente não encontrado:', clienteId);
            toast({
              title: "Erro",
              description: "Cliente não encontrado",
              variant: "destructive"
            });
            return null;
          }

          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('cliente_id', clienteId)
            .maybeSingle();

          if (error) {
            console.error('Erro ao carregar agendamento:', error);
            toast({
              title: "Erro",
              description: "Não foi possível carregar o agendamento do cliente",
              variant: "destructive"
            });
            return null;
          }

          if (data) {
            const agendamento: AgendamentoCliente = {
              id: data.id,
              cliente_id: data.cliente_id,
              status_agendamento: data.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
              data_proxima_reposicao: data.data_proxima_reposicao ? parseDateFromDatabase(data.data_proxima_reposicao) : undefined,
              quantidade_total: data.quantidade_total,
              tipo_pedido: data.tipo_pedido as 'Padrão' | 'Alterado',
              itens_personalizados: data.itens_personalizados as Array<{ produto: string; quantidade: number }> | undefined,
              created_at: new Date(data.created_at),
              updated_at: new Date(data.updated_at)
            };
            console.log('Agendamento carregado com data:', data.data_proxima_reposicao, '-> convertida para:', agendamento.data_proxima_reposicao);
            return agendamento;
          }

          // Se não existe agendamento, criar um padrão automaticamente
          return await get().criarAgendamentoPadrao(clienteId);
        } catch (error) {
          console.error('Erro ao carregar agendamento:', error);
          toast({
            title: "Erro",
            description: "Erro inesperado ao carregar agendamento",
            variant: "destructive"
          });
          return null;
        } finally {
          set({ loading: false });
        }
      },
      
      criarAgendamentoPadrao: async (clienteId: string) => {
        try {
          const dadosDefault = {
            cliente_id: clienteId,
            status_agendamento: 'Agendar' as const,
            quantidade_total: 0,
            tipo_pedido: 'Padrão' as const,
            itens_personalizados: null
          };

          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .insert([dadosDefault])
            .select()
            .single();

          if (error) {
            console.error('Erro ao criar agendamento padrão:', error);
            throw error;
          }

          const agendamento: AgendamentoCliente = {
            id: data.id,
            cliente_id: data.cliente_id,
            status_agendamento: data.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
            data_proxima_reposicao: data.data_proxima_reposicao ? parseDateFromDatabase(data.data_proxima_reposicao) : undefined,
            quantidade_total: data.quantidade_total,
            tipo_pedido: data.tipo_pedido as 'Padrão' | 'Alterado',
            itens_personalizados: data.itens_personalizados as Array<{ produto: string; quantidade: number }> | undefined,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at)
          };

          return agendamento;
        } catch (error) {
          console.error('Erro ao criar agendamento padrão:', error);
          throw error;
        }
      },
      
      salvarAgendamento: async (clienteId: string, dados: Partial<AgendamentoCliente>) => {
        set({ loading: true });
        try {
          const dadosSupabase = {
            cliente_id: clienteId,
            status_agendamento: dados.status_agendamento,
            data_proxima_reposicao: dados.data_proxima_reposicao ? formatDateForDatabase(dados.data_proxima_reposicao) : null,
            quantidade_total: dados.quantidade_total,
            tipo_pedido: dados.tipo_pedido,
            itens_personalizados: dados.itens_personalizados || null
          };

          console.log('Salvando agendamento com data:', dados.data_proxima_reposicao, '-> formatada para:', dadosSupabase.data_proxima_reposicao);

          // Verificar se já existe um agendamento para este cliente
          const { data: existente } = await supabase
            .from('agendamentos_clientes')
            .select('id')
            .eq('cliente_id', clienteId)
            .maybeSingle();

          let agendamentoSalvo;

          if (existente) {
            // Atualizar agendamento existente
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .update(dadosSupabase)
              .eq('cliente_id', clienteId)
              .select()
              .single();

            if (error) {
              throw error;
            }
            agendamentoSalvo = data;
          } else {
            // Criar novo agendamento
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .insert([dadosSupabase])
              .select()
              .single();

            if (error) {
              throw error;
            }
            agendamentoSalvo = data;
          }

          // Update local state immediately
          if (agendamentoSalvo) {
            const agendamentoConvertido: AgendamentoCliente = {
              id: agendamentoSalvo.id,
              cliente_id: agendamentoSalvo.cliente_id,
              status_agendamento: agendamentoSalvo.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
              data_proxima_reposicao: agendamentoSalvo.data_proxima_reposicao ? parseDateFromDatabase(agendamentoSalvo.data_proxima_reposicao) : undefined,
              quantidade_total: agendamentoSalvo.quantidade_total,
              tipo_pedido: agendamentoSalvo.tipo_pedido as 'Padrão' | 'Alterado',
              itens_personalizados: agendamentoSalvo.itens_personalizados as Array<{ produto: string; quantidade: number }> | undefined,
              created_at: new Date(agendamentoSalvo.created_at),
              updated_at: new Date(agendamentoSalvo.updated_at)
            };

            get().atualizarAgendamentoLocal(agendamentoConvertido);
          }

          toast({
            title: "Sucesso",
            description: "Agendamento salvo com sucesso"
          });

          // Reload all schedules to ensure consistency
          await get().carregarTodosAgendamentos();
        } catch (error) {
          console.error('Erro ao salvar agendamento:', error);
          toast({
            title: "Erro",
            description: "Não foi possível salvar o agendamento",
            variant: "destructive"
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      },
      
      removerAgendamento: async (clienteId: string) => {
        set({ loading: true });
        try {
          const { error } = await supabase
            .from('agendamentos_clientes')
            .delete()
            .eq('cliente_id', clienteId);

          if (error) {
            throw error;
          }

          toast({
            title: "Agendamento removido",
            description: "Agendamento removido com sucesso"
          });
        } catch (error) {
          console.error('Erro ao remover agendamento:', error);
          toast({
            title: "Erro",
            description: "Não foi possível remover o agendamento",
            variant: "destructive"
          });
          throw error;
        } finally {
          set({ loading: false });
        }
      }
    }),
    { name: 'agendamento-cliente-store' }
  )
);
