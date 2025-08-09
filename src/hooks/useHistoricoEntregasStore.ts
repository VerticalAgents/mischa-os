
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";
import { subDays } from "date-fns";

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

interface FiltrosHistorico {
  dataInicio: Date;
  dataFim: Date;
  tipo: 'todos' | 'entrega' | 'retorno';
}

interface HistoricoEntregasStore {
  historico: HistoricoEntrega[];
  isLoading: boolean;
  filtros: FiltrosHistorico;
  
  // Métodos principais
  carregarHistorico: (clienteId?: string) => Promise<void>;
  adicionarRegistro: (novoRegistro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at'>) => Promise<string | null>;
  atualizarRegistro: (id: string, updates: Partial<HistoricoEntrega>) => Promise<void>;
  removerRegistro: (id: string) => Promise<void>;
  
  // Métodos de filtros
  setFiltroDataInicio: (data: Date) => void;
  setFiltroDataFim: (data: Date) => void;
  setFiltroTipo: (tipo: 'todos' | 'entrega' | 'retorno') => void;
  resetFiltros: () => void;
  getRegistrosFiltrados: () => HistoricoEntrega[];
  
  // Aliases para compatibilidade
  registros: HistoricoEntrega[];
  editarRegistro: (id: string, updates: Partial<HistoricoEntrega>) => Promise<void>;
  excluirRegistro: (id: string) => Promise<void>;
}

const filtrosIniciais: FiltrosHistorico = {
  dataInicio: subDays(new Date(), 60), // 2 meses atrás
  dataFim: new Date(),
  tipo: 'todos'
};

export const useHistoricoEntregasStore = create<HistoricoEntregasStore>()(
  devtools(
    (set, get) => ({
      historico: [],
      isLoading: false,
      filtros: filtrosIniciais,
      
      // Getter computado para compatibilidade
      get registros() {
        return get().historico;
      },
      
      adicionarRegistro: async (novoRegistro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
        try {
          console.log('📝 Adicionando novo registro ao histórico:', novoRegistro);
          
          const registroCompleto = {
            cliente_id: novoRegistro.cliente_id,
            data: novoRegistro.data instanceof Date ? novoRegistro.data.toISOString() : novoRegistro.data,
            tipo: novoRegistro.tipo,
            quantidade: novoRegistro.quantidade,
            itens: JSON.stringify(novoRegistro.itens || []),
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
          
          // Converter tipos para compatibilidade com Supabase
          const updateData: any = { ...updates };
          if (updateData.data instanceof Date) {
            updateData.data = updateData.data.toISOString();
          }
          if (updateData.itens) {
            updateData.itens = JSON.stringify(updateData.itens);
          }
          
          const { error } = await supabase
            .from('historico_entregas')
            .update(updateData)
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
          
          // Converter dados do banco para o formato interno
          const historico = data?.map(item => ({
            ...item,
            data: new Date(item.data),
            created_at: item.created_at ? new Date(item.created_at) : undefined,
            updated_at: item.updated_at ? new Date(item.updated_at) : undefined,
            itens: item.itens ? (typeof item.itens === 'string' ? JSON.parse(item.itens) : item.itens) : []
          })) || [];
          
          set({ historico });
        } catch (error) {
          console.error('Erro ao carregar histórico:', error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Métodos de filtros
      setFiltroDataInicio: (data: Date) => {
        set(state => ({
          filtros: { ...state.filtros, dataInicio: data }
        }));
      },
      
      setFiltroDataFim: (data: Date) => {
        set(state => ({
          filtros: { ...state.filtros, dataFim: data }
        }));
      },
      
      setFiltroTipo: (tipo: 'todos' | 'entrega' | 'retorno') => {
        set(state => ({
          filtros: { ...state.filtros, tipo }
        }));
      },
      
      resetFiltros: () => {
        set({ filtros: filtrosIniciais });
      },
      
      getRegistrosFiltrados: () => {
        const { historico, filtros } = get();
        return historico.filter(registro => {
          const dataRegistro = new Date(registro.data);
          const dentroDoIntervalo = dataRegistro >= filtros.dataInicio && dataRegistro <= filtros.dataFim;
          const tipoMatch = filtros.tipo === 'todos' || registro.tipo === filtros.tipo;
          return dentroDoIntervalo && tipoMatch;
        });
      },
      
      // Aliases para compatibilidade
      editarRegistro: async (id: string, updates: Partial<HistoricoEntrega>) => {
        return get().atualizarRegistro(id, updates);
      },
      
      excluirRegistro: async (id: string) => {
        return get().removerRegistro(id);
      }
    }),
    { name: 'historico-entregas-store' }
  )
);
