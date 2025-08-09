import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";

export interface ItemHistoricoEntrega {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export interface HistoricoEntrega {
  id?: string;
  cliente_id: string;
  data: Date | string;
  tipo: 'entrega' | 'retorno';
  quantidade: number;
  itens?: ItemHistoricoEntrega[];
  status_anterior?: string;
  observacao?: string;
  created_at?: Date;
  updated_at?: Date;
  editado_manualmente?: boolean;
}

interface HistoricoEntregasStore {
  historico: HistoricoEntrega[];
  isLoading: boolean;
  
  carregarHistorico: (clienteId?: string) => Promise<void>;
  adicionarRegistro: (novoRegistro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at'>) => Promise<string | null>;
  atualizarRegistro: (id: string, updates: Partial<HistoricoEntrega>) => Promise<void>;
  removerRegistro: (id: string) => Promise<void>;
}

export const useHistoricoEntregasStore = create<HistoricoEntregasStore>()(
  devtools(
    (set, get) => ({
      historico: [],
      isLoading: false,
      
      adicionarRegistro: async (novoRegistro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
        try {
          console.log('📝 Adicionando novo registro ao histórico:', novoRegistro);
          
          const registroCompleto = {
            cliente_id: novoRegistro.cliente_id,
            data: novoRegistro.data instanceof Date ? novoRegistro.data.toISOString() : novoRegistro.data,
            tipo: novoRegistro.tipo,
            quantidade: novoRegistro.quantidade,
            itens: novoRegistro.itens || [],
            status_anterior: novoRegistro.status_anterior,
            observacao: novoRegistro.observacao,
            editado_manualmente: false
          };

          const { data, error } = await supabase
            .from('historico_entregas')
            .insert([registroCompleto])
            .select()
            .single();

          if (error) {
            console.error('❌ Erro ao inserir registro:', error);
            throw error;
          }

          console.log('✅ Registro inserido com sucesso:', data);
          
          // Atualizar estado local
          await get().carregarHistorico();
          
          return data.id;
        } catch (error) {
          console.error('❌ Erro ao adicionar registro:', error);
          return null;
        }
      },

      atualizarRegistro: async (id: string, updates: Partial<HistoricoEntrega>) => {
        try {
          console.log(`📝 Atualizando registro ${id} com:`, updates);
          
          const { error } = await supabase
            .from('historico_entregas')
            .update(updates)
            .eq('id', id);

          if (error) {
            console.error('❌ Erro ao atualizar registro:', error);
            throw error;
          }

          console.log('✅ Registro atualizado com sucesso');
          await get().carregarHistorico();
        } catch (error) {
          console.error('❌ Erro ao atualizar registro:', error);
        }
      },

      removerRegistro: async (id: string) => {
        try {
          console.log('🗑️ Removendo registro:', id);
          
          const { error } = await supabase
            .from('historico_entregas')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('❌ Erro ao remover registro:', error);
            throw error;
          }

          console.log('✅ Registro removido com sucesso');
          await get().carregarHistorico();
        } catch (error) {
          console.error('❌ Erro ao remover registro:', error);
        }
      },

      carregarHistorico: async (clienteId?: string) => {
        set({ isLoading: true });
        try {
          console.log('🔄 Carregando histórico de entregas...');
          
          let query = supabase
            .from('historico_entregas')
            .select('*')
            .order('data', { ascending: false })
            .order('created_at', { ascending: false });

          if (clienteId) {
            query = query.eq('cliente_id', clienteId);
          }

          const { data, error } = await query;

          if (error) {
            console.error('Erro ao carregar histórico:', error);
            throw error;
          }

          console.log('✅ Histórico carregado com sucesso:', data?.length);
          set({ historico: data || [] });
        } catch (error) {
          console.error('Erro ao carregar histórico:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    { name: 'historico-entregas-store' }
  )
);
