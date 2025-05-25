
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
}

export const useAgendamentoClienteStore = create<AgendamentoClienteStore>()(
  devtools(
    (set, get) => ({
      agendamentos: [],
      loading: false,
      
      carregarAgendamentoPorCliente: async (clienteId: string) => {
        set({ loading: true });
        try {
          console.log('Carregando agendamento para cliente:', clienteId);
          
          // Primeiro, verificar se o cliente existe na tabela clientes
          const { data: clienteData, error: clienteError } = await supabase
            .from('clientes')
            .select('id')
            .eq('id', clienteId) // Removido .toString() - clienteId já é string
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
            .eq('cliente_id', clienteId) // Removido .toString()
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
              data_proxima_reposicao: data.data_proxima_reposicao ? new Date(data.data_proxima_reposicao) : undefined,
              quantidade_total: data.quantidade_total,
              tipo_pedido: data.tipo_pedido as 'Padrão' | 'Alterado',
              itens_personalizados: data.itens_personalizados as Array<{ produto: string; quantidade: number }> | undefined,
              created_at: new Date(data.created_at),
              updated_at: new Date(data.updated_at)
            };
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
            cliente_id: clienteId, // Removido .toString()
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
            data_proxima_reposicao: data.data_proxima_reposicao ? new Date(data.data_proxima_reposicao) : undefined,
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
            cliente_id: clienteId, // Removido .toString()
            status_agendamento: dados.status_agendamento,
            data_proxima_reposicao: dados.data_proxima_reposicao?.toISOString().split('T')[0],
            quantidade_total: dados.quantidade_total,
            tipo_pedido: dados.tipo_pedido,
            itens_personalizados: dados.itens_personalizados || null
          };

          // Verificar se já existe um agendamento para este cliente
          const { data: existente } = await supabase
            .from('agendamentos_clientes')
            .select('id')
            .eq('cliente_id', clienteId) // Removido .toString()
            .maybeSingle();

          if (existente) {
            // Atualizar agendamento existente
            const { error } = await supabase
              .from('agendamentos_clientes')
              .update(dadosSupabase)
              .eq('cliente_id', clienteId); // Removido .toString()

            if (error) {
              throw error;
            }
          } else {
            // Criar novo agendamento
            const { error } = await supabase
              .from('agendamentos_clientes')
              .insert([dadosSupabase]);

            if (error) {
              throw error;
            }
          }

          toast({
            title: "Sucesso",
            description: "Agendamento salvo com sucesso"
          });
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
            .eq('cliente_id', clienteId); // Removido .toString()

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
