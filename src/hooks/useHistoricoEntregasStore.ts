
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { toast } from "sonner";

export interface ItemHistoricoEntrega {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

export interface HistoricoEntrega {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  data: Date;
  tipo: 'entrega' | 'retorno';
  quantidade: number;
  itens: ItemHistoricoEntrega[];
  status_anterior: string;
  observacao: string;
  editado_manualmente: boolean;
  created_at: Date;
  updated_at: Date;
}

interface FiltrosHistorico {
  dataInicio?: Date;
  dataFim?: Date;
  clienteId?: string;
  tipo?: 'entrega' | 'retorno' | '';
}

interface HistoricoEntregasStore {
  registros: HistoricoEntrega[];
  isLoading: boolean;
  filtros: FiltrosHistorico;
  
  carregarHistorico: (semana?: Date) => Promise<void>;
  adicionarRegistro: (registro: Omit<HistoricoEntrega, 'id' | 'created_at' | 'updated_at' | 'cliente_nome'>) => Promise<string | null>;
  editarRegistro: (id: string, dados: Partial<HistoricoEntrega>) => Promise<void>;
  excluirRegistro: (id: string) => Promise<void>;
  
  // Filtros
  setFiltroDataInicio: (data?: Date) => void;
  setFiltroDataFim: (data?: Date) => void;
  setFiltroTipo: (tipo?: 'entrega' | 'retorno' | '') => void;
  resetFiltros: () => void;
  getRegistrosFiltrados: () => HistoricoEntrega[];
  
  // Estatísticas
  getEstatisticasPeriodo: (inicio: Date, fim: Date) => {
    totalEntregas: number;
    totalRetornos: number;
    quantidadeTotal: number;
    sucessoPercentual: number;
  };
}

export const useHistoricoEntregasStore = create<HistoricoEntregasStore>()(
  devtools(
    (set, get) => ({
      registros: [],
      isLoading: false,
      filtros: {},
      
      setFiltroDataInicio: (data?: Date) => {
        set(state => ({
          filtros: { ...state.filtros, dataInicio: data }
        }));
      },
      
      setFiltroDataFim: (data?: Date) => {
        set(state => ({
          filtros: { ...state.filtros, dataFim: data }
        }));
      },
      
      setFiltroTipo: (tipo?: 'entrega' | 'retorno' | '') => {
        set(state => ({
          filtros: { ...state.filtros, tipo: tipo || undefined }
        }));
      },
      
      resetFiltros: () => {
        set({ filtros: {} });
      },
      
      getRegistrosFiltrados: () => {
        const { registros, filtros } = get();
        
        return registros.filter(registro => {
          if (filtros.dataInicio && registro.data < filtros.dataInicio) return false;
          if (filtros.dataFim && registro.data > filtros.dataFim) return false;
          if (filtros.clienteId && registro.cliente_id !== filtros.clienteId) return false;
          if (filtros.tipo && registro.tipo !== filtros.tipo) return false;
          return true;
        });
      },
      
      carregarHistorico: async (semana?: Date) => {
        set({ isLoading: true });
        try {
          const dataReferencia = semana || new Date();
          const inicioSemana = startOfWeek(dataReferencia, { weekStartsOn: 1 });
          const fimSemana = endOfWeek(dataReferencia, { weekStartsOn: 1 });

          const { data, error } = await supabase
            .from('historico_entregas')
            .select(`
              *,
              clientes!inner(nome)
            `)
            .gte('data', inicioSemana.toISOString())
            .lte('data', fimSemana.toISOString())
            .order('data', { ascending: false });

          if (error) throw error;

          const registrosConvertidos: HistoricoEntrega[] = data?.map((registro: any) => ({
            id: registro.id,
            cliente_id: registro.cliente_id,
            cliente_nome: registro.clientes?.nome || 'Cliente não identificado',
            data: parseISO(registro.data),
            tipo: registro.tipo as 'entrega' | 'retorno',
            quantidade: registro.quantidade,
            itens: registro.itens as ItemHistoricoEntrega[] || [],
            status_anterior: registro.status_anterior || '',
            observacao: registro.observacao || '',
            editado_manualmente: registro.editado_manualmente || false,
            created_at: parseISO(registro.created_at),
            updated_at: parseISO(registro.updated_at),
            clientes: registro.clientes
          })) || [];

          set({ registros: registrosConvertidos });
          console.log(`✅ ${registrosConvertidos.length} registros de histórico carregados`);
        } catch (error) {
          console.error('❌ Erro ao carregar histórico:', error);
          toast.error('Erro ao carregar histórico de entregas');
        } finally {
          set({ isLoading: false });
        }
      },

      adicionarRegistro: async (registro) => {
        try {
          const dadosParaInserir = {
            cliente_id: registro.cliente_id,
            data: registro.data.toISOString(),
            tipo: registro.tipo,
            quantidade: registro.quantidade,
            itens: registro.itens as any,
            status_anterior: registro.status_anterior || '',
            observacao: registro.observacao || '',
            editado_manualmente: registro.editado_manualmente || false
          };

          const { data, error } = await supabase
            .from('historico_entregas')
            .insert([dadosParaInserir])
            .select()
            .single();

          if (error) throw error;

          // Adicionar ao estado local
          const novoRegistro: HistoricoEntrega = {
            id: data.id,
            cliente_id: data.cliente_id,
            data: parseISO(data.data),
            tipo: data.tipo as 'entrega' | 'retorno',
            quantidade: data.quantidade,
            itens: data.itens as ItemHistoricoEntrega[] || [],
            status_anterior: data.status_anterior || '',
            observacao: data.observacao || '',
            editado_manualmente: data.editado_manualmente || false,
            created_at: parseISO(data.created_at),
            updated_at: parseISO(data.updated_at)
          };

          set(state => ({
            registros: [novoRegistro, ...state.registros]
          }));

          console.log('✅ Registro adicionado ao histórico:', data.id);
          return data.id;
        } catch (error) {
          console.error('❌ Erro ao adicionar registro:', error);
          toast.error('Erro ao registrar no histórico');
          return null;
        }
      },

      editarRegistro: async (id: string, dados) => {
        try {
          const dadosParaAtualizar: any = {};
          
          if (dados.data) dadosParaAtualizar.data = dados.data.toISOString();
          if (dados.tipo) dadosParaAtualizar.tipo = dados.tipo;
          if (dados.quantidade !== undefined) dadosParaAtualizar.quantidade = dados.quantidade;
          if (dados.itens) dadosParaAtualizar.itens = dados.itens;
          if (dados.status_anterior) dadosParaAtualizar.status_anterior = dados.status_anterior;
          if (dados.observacao !== undefined) dadosParaAtualizar.observacao = dados.observacao;
          if (dados.editado_manualmente !== undefined) dadosParaAtualizar.editado_manualmente = dados.editado_manualmente;

          const { error } = await supabase
            .from('historico_entregas')
            .update(dadosParaAtualizar)
            .eq('id', id);

          if (error) throw error;

          // Atualizar estado local
          set(state => ({
            registros: state.registros.map(r => 
              r.id === id ? { ...r, ...dados } : r
            )
          }));

          toast.success('Registro atualizado com sucesso');
        } catch (error) {
          console.error('❌ Erro ao editar registro:', error);
          toast.error('Erro ao editar registro');
        }
      },

      excluirRegistro: async (id: string) => {
        try {
          const { error } = await supabase
            .from('historico_entregas')
            .delete()
            .eq('id', id);

          if (error) throw error;

          // Remover do estado local
          set(state => ({
            registros: state.registros.filter(r => r.id !== id)
          }));

          toast.success('Registro excluído com sucesso');
        } catch (error) {
          console.error('❌ Erro ao excluir registro:', error);
          toast.error('Erro ao excluir registro');
        }
      },
      
      getEstatisticasPeriodo: (inicio: Date, fim: Date) => {
        const registros = get().registros.filter(r => 
          r.data >= inicio && r.data <= fim
        );
        
        const entregas = registros.filter(r => r.tipo === 'entrega');
        const retornos = registros.filter(r => r.tipo === 'retorno');
        
        const totalEntregas = entregas.length;
        const totalRetornos = retornos.length;
        const quantidadeTotal = entregas.reduce((acc, r) => acc + r.quantidade, 0);
        const sucessoPercentual = totalEntregas > 0 ? ((totalEntregas - totalRetornos) / totalEntregas) * 100 : 0;
        
        return {
          totalEntregas,
          totalRetornos,
          quantidadeTotal,
          sucessoPercentual
        };
      }
    }),
    { name: 'historico-entregas-store' }
  )
);
