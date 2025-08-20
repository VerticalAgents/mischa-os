
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';

interface HistoricoEntrega {
  id: string;
  cliente_id: string;
  cliente_nome: string; // Calculado, não existe na tabela
  data: Date;
  tipo: 'entrega' | 'retorno';
  quantidade: number;
  itens: any[];
  status_anterior?: string;
  observacao?: string;
  editado_manualmente?: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FiltrosHistorico {
  dataInicio: Date;
  dataFim: Date;
  tipo: 'todos' | 'entrega' | 'retorno';
  clienteId?: string;
}

interface HistoricoEntregasStore {
  registros: HistoricoEntrega[];
  isLoading: boolean;
  filtros: FiltrosHistorico;
  
  // Actions
  carregarHistorico: (clienteId?: string) => Promise<void>;
  adicionarRegistro: (registro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at' | 'cliente_nome'>) => Promise<void>;
  editarRegistro: (id: string, dados: Partial<HistoricoEntrega>) => Promise<void>;
  removerRegistro: (id: string) => Promise<void>;
  
  // Filtros
  setFiltroDataInicio: (data: Date) => void;
  setFiltroDataFim: (data: Date) => void;
  setFiltroTipo: (tipo: 'todos' | 'entrega' | 'retorno') => void;
  resetFiltros: () => void;
  
  // Getters
  getRegistrosFiltrados: () => HistoricoEntrega[];
}

// Função auxiliar para carregar nome do cliente
const carregarNomeCliente = async (clienteId: string): Promise<string> => {
  try {
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('nome')
      .eq('id', clienteId)
      .single();

    if (error) {
      console.warn('Erro ao carregar nome do cliente:', error);
      return 'Cliente não encontrado';
    }

    return cliente?.nome || 'Cliente não encontrado';
  } catch (error) {
    console.warn('Erro ao carregar nome do cliente:', error);
    return 'Cliente não encontrado';
  }
};

export const useHistoricoEntregasStore = create<HistoricoEntregasStore>()(
  devtools(
    (set, get) => ({
      registros: [],
      isLoading: false,
      filtros: {
        dataInicio: subMonths(new Date(), 2),
        dataFim: new Date(),
        tipo: 'todos'
      },

      carregarHistorico: async (clienteId?: string) => {
        set({ isLoading: true });
        
        try {
          console.log('useHistoricoEntregasStore: Carregando histórico...', { clienteId });
          
          let query = supabase
            .from('historico_entregas')
            .select('*')
            .order('data', { ascending: false });

          // Filtrar por cliente se fornecido
          if (clienteId) {
            query = query.eq('cliente_id', clienteId);
            set(state => ({ 
              filtros: { ...state.filtros, clienteId } 
            }));
          } else {
            // Remover filtro de cliente se não fornecido
            set(state => ({ 
              filtros: { ...state.filtros, clienteId: undefined } 
            }));
          }

          const { data, error } = await query;

          if (error) {
            console.error('Erro ao carregar histórico:', error);
            toast.error('Erro ao carregar histórico de entregas');
            throw error;
          }

          console.log('useHistoricoEntregasStore: Dados brutos carregados:', data?.length || 0);

          if (!data || data.length === 0) {
            console.log('useHistoricoEntregasStore: Nenhum registro encontrado');
            set({ registros: [], isLoading: false });
            return;
          }

          // Processar os registros e garantir que tenham nome do cliente
          const registrosProcessados = await Promise.all(
            data.map(async (registro) => {
              const clienteNome = await carregarNomeCliente(registro.cliente_id);

              return {
                id: registro.id,
                cliente_id: registro.cliente_id,
                cliente_nome: clienteNome,
                data: new Date(registro.data),
                tipo: registro.tipo as 'entrega' | 'retorno',
                quantidade: registro.quantidade || 0,
                itens: Array.isArray(registro.itens) ? registro.itens : [],
                status_anterior: registro.status_anterior,
                observacao: registro.observacao,
                editado_manualmente: registro.editado_manualmente || false,
                created_at: new Date(registro.created_at),
                updated_at: new Date(registro.updated_at)
              };
            })
          );

          console.log('useHistoricoEntregasStore: Registros processados:', registrosProcessados.length);
          set({ registros: registrosProcessados });

        } catch (error) {
          console.error('Erro ao carregar histórico:', error);
          toast.error('Erro ao carregar dados do histórico');
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarRegistro: async (novoRegistro) => {
        try {
          console.log('useHistoricoEntregasStore: Adicionando registro:', novoRegistro);
          
          const { data, error } = await supabase
            .from('historico_entregas')
            .insert([{
              cliente_id: novoRegistro.cliente_id,
              data: novoRegistro.data.toISOString(),
              tipo: novoRegistro.tipo,
              quantidade: novoRegistro.quantidade,
              itens: novoRegistro.itens || [],
              status_anterior: novoRegistro.status_anterior,
              observacao: novoRegistro.observacao,
              editado_manualmente: true
            }])
            .select()
            .single();

          if (error) {
            console.error('Erro ao adicionar registro:', error);
            throw error;
          }

          // Recarregar dados para manter consistência
          await get().carregarHistorico();
          toast.success('Registro adicionado com sucesso');

        } catch (error) {
          console.error('Erro ao adicionar registro:', error);
          toast.error('Erro ao adicionar registro');
        }
      },

      editarRegistro: async (id, dadosAtualizacao) => {
        try {
          console.log('useHistoricoEntregasStore: Editando registro:', id, dadosAtualizacao);
          
          const updateData: any = { ...dadosAtualizacao };
          
          // Converter data se necessário
          if (updateData.data instanceof Date) {
            updateData.data = updateData.data.toISOString();
          }
          
          // Marcar como editado manualmente
          updateData.editado_manualmente = true;

          // Remover campos que não existem na tabela
          delete updateData.cliente_nome;
          delete updateData.created_at;
          delete updateData.updated_at;

          const { error } = await supabase
            .from('historico_entregas')
            .update(updateData)
            .eq('id', id);

          if (error) {
            console.error('Erro ao editar registro:', error);
            throw error;
          }

          // Recarregar dados para manter consistência
          await get().carregarHistorico();
          toast.success('Registro atualizado com sucesso');

        } catch (error) {
          console.error('Erro ao editar registro:', error);
          toast.error('Erro ao editar registro');
        }
      },

      removerRegistro: async (id) => {
        try {
          console.log('useHistoricoEntregasStore: Removendo registro:', id);
          
          const { error } = await supabase
            .from('historico_entregas')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Erro ao remover registro:', error);
            throw error;
          }

          // Recarregar dados para manter consistência
          await get().carregarHistorico();
          toast.success('Registro removido com sucesso');

        } catch (error) {
          console.error('Erro ao remover registro:', error);
          toast.error('Erro ao remover registro');
        }
      },

      setFiltroDataInicio: (data) => {
        console.log('useHistoricoEntregasStore: Definindo data início:', data);
        set(state => ({
          filtros: { ...state.filtros, dataInicio: data }
        }));
      },

      setFiltroDataFim: (data) => {
        console.log('useHistoricoEntregasStore: Definindo data fim:', data);
        set(state => ({
          filtros: { ...state.filtros, dataFim: data }
        }));
      },

      setFiltroTipo: (tipo) => {
        console.log('useHistoricoEntregasStore: Definindo tipo:', tipo);
        set(state => ({
          filtros: { ...state.filtros, tipo }
        }));
      },

      resetFiltros: () => {
        console.log('useHistoricoEntregasStore: Resetando filtros');
        set({
          filtros: {
            dataInicio: subMonths(new Date(), 2),
            dataFim: new Date(),
            tipo: 'todos'
          }
        });
      },

      getRegistrosFiltrados: () => {
        const { registros, filtros } = get();
        
        console.log('useHistoricoEntregasStore: Aplicando filtros:', {
          totalRegistros: registros.length,
          filtros
        });

        let registrosFiltrados = registros.filter(registro => {
          const dataRegistro = new Date(registro.data);
          const dataInicio = new Date(filtros.dataInicio);
          const dataFim = new Date(filtros.dataFim);
          
          // Configurar datas para comparação (início do dia para dataInicio, fim do dia para dataFim)
          dataInicio.setHours(0, 0, 0, 0);
          dataFim.setHours(23, 59, 59, 999);
          
          const dentroDoPerodo = dataRegistro >= dataInicio && dataRegistro <= dataFim;
          const tipoCorreto = filtros.tipo === 'todos' || registro.tipo === filtros.tipo;
          
          return dentroDoPerodo && tipoCorreto;
        });

        console.log('useHistoricoEntregasStore: Registros após filtros:', registrosFiltrados.length);
        return registrosFiltrados;
      }
    }),
    { name: 'historico-entregas-store' }
  )
);
