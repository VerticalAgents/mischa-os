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
  excluirRegistro: (id: string) => Promise<void>;
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
          console.log('🔄 Carregando histórico de entregas...', clienteId ? `para cliente ${clienteId}` : 'geral');
          
          // Query otimizada - buscar apenas últimos 1000 registros ordenados por data
          let query = supabase
            .from('historico_entregas')
            .select(`
              id,
              cliente_id,
              data,
              tipo,
              quantidade,
              itens,
              status_anterior,
              observacao,
              editado_manualmente,
              created_at,
              updated_at,
              clientes!inner(nome)
            `)
            .order('data', { ascending: false })
            .limit(1000);
          
          if (clienteId) {
            query = query.eq('cliente_id', clienteId);
            set(state => ({
              filtros: { ...state.filtros, clienteId }
            }));
          }
          
          const { data: historico, error } = await query;
          
          if (error) {
            console.error('Erro ao carregar histórico:', error);
            throw error;
          }
          
          // Buscar produtos em uma única query para resolver nomes
          const produtoIds = new Set<string>();
          historico?.forEach(registro => {
            if (Array.isArray(registro.itens)) {
              registro.itens.forEach((item: any) => {
                if (item.produto_id) {
                  produtoIds.add(item.produto_id);
                }
              });
            }
          });

          // Buscar nomes dos produtos se houver IDs
          let produtosMap = new Map<string, string>();
          if (produtoIds.size > 0) {
            const { data: produtos } = await supabase
              .from('produtos_finais')
              .select('id, nome')
              .in('id', Array.from(produtoIds));
            
            produtosMap = new Map(produtos?.map(p => [p.id, p.nome]) || []);
          }
          
          const registrosFormatados: HistoricoEntrega[] = (historico || []).map(registro => {
            // Processar itens para incluir nomes dos produtos
            const itensProcessados = Array.isArray(registro.itens) 
              ? registro.itens.map((item: any) => ({
                  ...item,
                  produto_nome: produtosMap.get(item.produto_id) || `Produto ${item.produto_id?.substring(0, 8) || 'N/A'}`
                }))
              : [];

            return {
              id: registro.id,
              cliente_id: registro.cliente_id,
              data: new Date(registro.data),
              tipo: registro.tipo as 'entrega' | 'retorno',
              quantidade: registro.quantidade,
              itens: itensProcessados,
              status_anterior: registro.status_anterior || undefined,
              observacao: registro.observacao || undefined,
              editado_manualmente: registro.editado_manualmente || false,
              created_at: new Date(registro.created_at),
              updated_at: new Date(registro.updated_at),
              cliente_nome: (registro.clientes as any)?.nome || 'Cliente não encontrado'
            };
          });
          
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
          console.log('📝 Adicionando novo registro no histórico:', {
            cliente_id: registro.cliente_id,
            tipo: registro.tipo,
            quantidade: registro.quantidade,
            data: registro.data
          });

          const registroParaInserir = {
            cliente_id: registro.cliente_id,
            data: registro.data.toISOString(),
            tipo: registro.tipo,
            quantidade: registro.quantidade,
            itens: registro.itens || [],
            status_anterior: registro.status_anterior || null,
            observacao: registro.observacao || null,
            editado_manualmente: registro.status_anterior === 'Manual'
          };

          const { data, error } = await supabase
            .from('historico_entregas')
            .insert([registroParaInserir])
            .select()
            .single();
          
          if (error) {
            console.error('Erro ao inserir no histórico:', error);
            throw error;
          }
          
          const { data: cliente } = await supabase
            .from('clientes')
            .select('nome')
            .eq('id', registro.cliente_id)
            .single();
          
          const novoRegistro: HistoricoEntrega = {
            id: data.id,
            cliente_id: data.cliente_id,
            data: new Date(data.data),
            tipo: data.tipo as 'entrega' | 'retorno',
            quantidade: data.quantidade,
            itens: Array.isArray(data.itens) ? data.itens : [],
            status_anterior: data.status_anterior || undefined,
            observacao: data.observacao || undefined,
            editado_manualmente: data.editado_manualmente || false,
            created_at: new Date(data.created_at),
            updated_at: new Date(data.updated_at),
            cliente_nome: cliente?.nome || 'Cliente não encontrado'
          };
          
          set(state => ({
            registros: [novoRegistro, ...state.registros]
          }));
          
          console.log('✅ Novo registro adicionado ao histórico:', {
            id: data.id,
            cliente: cliente?.nome,
            tipo: registro.tipo,
            quantidade: registro.quantidade
          });
          
        } catch (error) {
          console.error('❌ Erro ao adicionar registro ao histórico:', error);
          toast.error("Erro ao adicionar registro ao histórico");
          throw error;
        }
      },
      
      editarRegistro: async (id, dados) => {
        try {
          console.log('✏️ Editando registro do histórico:', { id, dados });

          const dadosParaAtualizar: any = {
            editado_manualmente: true,
            updated_at: new Date().toISOString()
          };

          if (dados.quantidade !== undefined) {
            dadosParaAtualizar.quantidade = dados.quantidade;
          }
          if (dados.observacao !== undefined) {
            dadosParaAtualizar.observacao = dados.observacao;
          }
          if (dados.data !== undefined) {
            dadosParaAtualizar.data = dados.data.toISOString();
          }
          if (dados.tipo !== undefined) {
            dadosParaAtualizar.tipo = dados.tipo;
          }

          const { error } = await supabase
            .from('historico_entregas')
            .update(dadosParaAtualizar)
            .eq('id', id);
          
          if (error) {
            console.error('Erro ao editar registro:', error);
            throw error;
          }
          
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
          
          console.log('✅ Registro editado com sucesso');
          toast.success("Registro editado com sucesso");
          
        } catch (error) {
          console.error('❌ Erro ao editar registro:', error);
          toast.error("Erro ao editar registro");
          throw error;
        }
      },

      excluirRegistro: async (id) => {
        try {
          console.log('🗑️ Excluindo registro do histórico:', { id });

          const { error } = await supabase
            .from('historico_entregas')
            .delete()
            .eq('id', id);
          
          if (error) {
            console.error('Erro ao excluir registro:', error);
            throw error;
          }
          
          set(state => ({
            registros: state.registros.filter(registro => registro.id !== id)
          }));
          
          console.log('✅ Registro excluído com sucesso');
          toast.success("Registro excluído com sucesso");
          
        } catch (error) {
          console.error('❌ Erro ao excluir registro:', error);
          toast.error("Erro ao excluir registro");
          throw error;
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
          dataRegistro.setHours(0, 0, 0, 0);
          
          const dataInicio = new Date(filtros.dataInicio);
          dataInicio.setHours(0, 0, 0, 0);
          
          const dataFim = new Date(filtros.dataFim);
          dataFim.setHours(23, 59, 59, 999);
          
          const dataMatch = dataRegistro >= dataInicio && dataRegistro <= dataFim;
          const tipoMatch = filtros.tipo === 'todos' || registro.tipo === filtros.tipo;
          const clienteMatch = !filtros.clienteId || registro.cliente_id === filtros.clienteId;
          
          return dataMatch && tipoMatch && clienteMatch;
        });
      }
    }),
    { name: 'historico-entregas-store' }
  )
);
