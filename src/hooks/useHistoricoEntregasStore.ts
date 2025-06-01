
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { subMonths, format } from 'date-fns';

export interface HistoricoEntrega {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  data: Date;
  tipo: 'entrega' | 'retorno';
  quantidade: number;
  itens: any[];
  status_anterior?: string;
  observacao?: string;
  editado_manualmente: boolean;
  created_at: Date;
  updated_at: Date;
}

interface HistoricoEntregasStore {
  registros: HistoricoEntrega[];
  isLoading: boolean;
  filtros: {
    dataInicio: Date;
    dataFim: Date;
    tipo: 'todos' | 'entrega' | 'retorno';
    clienteId?: string;
  };
  
  // Actions
  carregarHistorico: (clienteId?: string) => Promise<void>;
  adicionarRegistro: (registro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at' | 'editado_manualmente'>) => Promise<void>;
  editarRegistro: (id: string, dados: Partial<HistoricoEntrega>) => Promise<void>;
  setFiltroDataInicio: (data: Date) => void;
  setFiltroDataFim: (data: Date) => void;
  setFiltroTipo: (tipo: 'todos' | 'entrega' | 'retorno') => void;
  resetFiltros: () => void;
  
  // Getters
  getRegistrosFiltrados: () => HistoricoEntrega[];
}

const getDataPadrao = () => {
  const hoje = new Date();
  const doisMesesAtras = subMonths(hoje, 2);
  return { dataInicio: doisMesesAtras, dataFim: hoje };
};

export const useHistoricoEntregasStore = create<HistoricoEntregasStore>()(
  devtools(
    (set, get) => ({
      registros: [],
      isLoading: false,
      filtros: {
        ...getDataPadrao(),
        tipo: 'todos'
      },
      
      carregarHistorico: async (clienteId?: string) => {
        set({ isLoading: true });
        
        try {
          console.log('🔄 Carregando histórico de entregas...');
          
          let query = supabase
            .from('historico_entregas')
            .select('*')
            .order('data', { ascending: false });
          
          if (clienteId) {
            query = query.eq('cliente_id', clienteId);
          }
          
          const { data: historico, error } = await query;
          
          if (error) {
            console.error('Erro ao carregar histórico:', error);
            throw error;
          }
          
          // Carregar nomes dos clientes
          const clienteIds = [...new Set(historico?.map(h => h.cliente_id) || [])];
          const { data: clientes } = await supabase
            .from('clientes')
            .select('id, nome')
            .in('id', clienteIds);
          
          const clientesMap = new Map(clientes?.map(c => [c.id, c.nome]) || []);
          
          const registrosFormatados: HistoricoEntrega[] = (historico || []).map(registro => ({
            ...registro,
            data: new Date(registro.data),
            created_at: new Date(registro.created_at),
            updated_at: new Date(registro.updated_at),
            cliente_nome: clientesMap.get(registro.cliente_id) || 'Cliente não encontrado',
            tipo: registro.tipo as 'entrega' | 'retorno',
            editado_manualmente: registro.editado_manualmente || false,
            itens: Array.isArray(registro.itens) ? registro.itens : [],
            status_anterior: registro.status_anterior || undefined,
            observacao: registro.observacao || undefined
          }));
          
          console.log('✅ Histórico carregado:', registrosFormatados.length, 'registros');
          set({ registros: registrosFormatados });
          
        } catch (error) {
          console.error('Erro ao carregar histórico:', error);
          toast.error("Erro ao carregar histórico de entregas");
        } finally {
          set({ isLoading: false });
        }
      },
      
      adicionarRegistro: async (registro) => {
        try {
          const registroParaInserir = {
            cliente_id: registro.cliente_id,
            data: registro.data.toISOString(),
            tipo: registro.tipo,
            quantidade: registro.quantidade,
            itens: registro.itens,
            status_anterior: registro.status_anterior || null,
            observacao: registro.observacao || null
          };

          const { data, error } = await supabase
            .from('historico_entregas')
            .insert([registroParaInserir])
            .select()
            .single();
          
          if (error) throw error;
          
          // Carregar nome do cliente
          const { data: cliente } = await supabase
            .from('clientes')
            .select('nome')
            .eq('id', registro.cliente_id)
            .single();
          
          const novoRegistro: HistoricoEntrega = {
            ...data,
            data: new Date(data.data),
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at),
            cliente_nome: cliente?.nome || 'Cliente não encontrado',
            tipo: data.tipo as 'entrega' | 'retorno',
            editado_manualmente: data.editado_manualmente || false,
            itens: Array.isArray(data.itens) ? data.itens : [],
            status_anterior: data.status_anterior || undefined,
            observacao: data.observacao || undefined
          };
          
          set(state => ({
            registros: [novoRegistro, ...state.registros]
          }));
          
          console.log('✅ Registro adicionado ao histórico:', registro.tipo);
          
        } catch (error) {
          console.error('Erro ao adicionar registro:', error);
          toast.error("Erro ao adicionar registro ao histórico");
        }
      },
      
      editarRegistro: async (id, dados) => {
        try {
          const dadosParaAtualizar: any = {
            editado_manualmente: true,
            updated_at: new Date().toISOString()
          };

          // Apenas incluir campos que foram fornecidos
          if (dados.quantidade !== undefined) {
            dadosParaAtualizar.quantidade = dados.quantidade;
          }
          if (dados.observacao !== undefined) {
            dadosParaAtualizar.observacao = dados.observacao;
          }

          const { error } = await supabase
            .from('historico_entregas')
            .update(dadosParaAtualizar)
            .eq('id', id);
          
          if (error) throw error;
          
          set(state => ({
            registros: state.registros.map(registro =>
              registro.id === id
                ? { 
                    ...registro, 
                    ...dados, 
                    editado_manualmente: true, 
                    updated_at: new Date() 
                  }
                : registro
            )
          }));
          
          toast.success("Registro editado com sucesso");
          
        } catch (error) {
          console.error('Erro ao editar registro:', error);
          toast.error("Erro ao editar registro");
        }
      },
      
      setFiltroDataInicio: (dataInicio) => {
        set(state => ({
          filtros: { ...state.filtros, dataInicio }
        }));
      },
      
      setFiltroDataFim: (dataFim) => {
        set(state => ({
          filtros: { ...state.filtros, dataFim }
        }));
      },
      
      setFiltroTipo: (tipo) => {
        set(state => ({
          filtros: { ...state.filtros, tipo }
        }));
      },
      
      resetFiltros: () => {
        set({
          filtros: {
            ...getDataPadrao(),
            tipo: 'todos'
          }
        });
      },
      
      getRegistrosFiltrados: () => {
        const { registros, filtros } = get();
        
        return registros.filter(registro => {
          const dataRegistro = new Date(registro.data);
          const dataMatch = dataRegistro >= filtros.dataInicio && dataRegistro <= filtros.dataFim;
          const tipoMatch = filtros.tipo === 'todos' || registro.tipo === filtros.tipo;
          const clienteMatch = !filtros.clienteId || registro.cliente_id === filtros.clienteId;
          
          return dataMatch && tipoMatch && clienteMatch;
        });
      }
    }),
    { name: 'historico-entregas-store' }
  )
);
