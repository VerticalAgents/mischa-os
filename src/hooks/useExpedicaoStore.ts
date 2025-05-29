
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SubstatusPedidoAgendado } from '@/types';
import { addBusinessDays, isWeekend, format, addDays } from 'date-fns';

interface PedidoExpedicao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  data_prevista_entrega: Date;
  quantidade_total: number;
  tipo_pedido: string;
  status_agendamento: string;
  substatus_pedido?: SubstatusPedidoAgendado;
  itens_personalizados?: any;
  created_at: Date;
}

interface ExpedicaoStore {
  pedidos: PedidoExpedicao[];
  isLoading: boolean;
  
  // Actions
  carregarPedidos: () => Promise<void>;
  confirmarSeparacao: (pedidoId: string) => Promise<void>;
  desfazerSeparacao: (pedidoId: string) => Promise<void>;
  confirmarDespacho: (pedidoId: string) => Promise<void>;
  confirmarEntrega: (pedidoId: string, observacao?: string) => Promise<void>;
  confirmarRetorno: (pedidoId: string, observacao?: string) => Promise<void>;
  marcarTodosSeparados: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarDespachoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarEntregaEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarRetornoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  
  // Getters
  getPedidosParaSeparacao: () => PedidoExpedicao[];
  getPedidosParaDespacho: () => PedidoExpedicao[];
  getPedidosProximoDia: () => PedidoExpedicao[];
  getPedidosAtrasados: () => PedidoExpedicao[];
}

const getProximoDiaUtil = (data: Date): Date => {
  const proximaData = addBusinessDays(new Date(data), 1);
  return isWeekend(proximaData) ? getProximoDiaUtil(proximaData) : proximaData;
};

// Função simples para parsing de data
const parseDataSegura = (dataString: string | Date): Date => {
  if (dataString instanceof Date) {
    return dataString;
  }
  
  if (typeof dataString === 'string' && dataString.includes('-')) {
    const parts = dataString.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  return new Date(dataString);
};

export const useExpedicaoStore = create<ExpedicaoStore>()(
  devtools(
    (set, get) => ({
      pedidos: [],
      isLoading: false,
      
      carregarPedidos: async () => {
        set({ isLoading: true });
        
        try {
          console.log('🔄 Carregando agendamentos...');
          
          const { data: agendamentos, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('status_agendamento', 'Agendado');

          if (error) {
            console.error('Erro ao carregar agendamentos:', error);
            throw error;
          }

          console.log('📥 Agendamentos carregados:', agendamentos?.length || 0);

          // Carregar dados dos clientes
          const { data: clientes, error: clientesError } = await supabase
            .from('clientes')
            .select('id, nome, endereco_entrega, contato_telefone');

          if (clientesError) {
            console.error('Erro ao carregar clientes:', clientesError);
            throw clientesError;
          }

          const clientesMap = new Map(clientes?.map(c => [c.id, c]) || []);

          const pedidosFormatados = (agendamentos || []).map(agendamento => {
            const cliente = clientesMap.get(agendamento.cliente_id);
            
            let dataPrevisao = new Date();
            if (agendamento.data_proxima_reposicao) {
              dataPrevisao = parseDataSegura(agendamento.data_proxima_reposicao);
            }
            
            return {
              id: agendamento.id,
              cliente_id: agendamento.cliente_id,
              cliente_nome: cliente?.nome || 'Cliente não encontrado',
              cliente_endereco: cliente?.endereco_entrega,
              cliente_telefone: cliente?.contato_telefone,
              data_prevista_entrega: dataPrevisao,
              quantidade_total: agendamento.quantidade_total || 0,
              tipo_pedido: agendamento.tipo_pedido || 'Padrão',
              status_agendamento: agendamento.status_agendamento,
              substatus_pedido: agendamento.substatus_pedido || 'Agendado',
              itens_personalizados: agendamento.itens_personalizados,
              created_at: agendamento.created_at ? new Date(agendamento.created_at) : new Date()
            };
          });

          console.log('✅ Pedidos formatados:', pedidosFormatados.length);
          set({ pedidos: pedidosFormatados });
          
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
          toast.error("Erro ao carregar pedidos");
        } finally {
          set({ isLoading: false });
        }
      },

      confirmarSeparacao: async (pedidoId: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' } : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' })
            .eq('id', pedidoId);

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' } : p
              )
            }));
            throw error;
          }

          toast.success(`Separação confirmada para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar separação:', error);
          toast.error("Erro ao confirmar separação");
        }
      },

      desfazerSeparacao: async (pedidoId: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' } : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Agendado' })
            .eq('id', pedidoId);

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' } : p
              )
            }));
            throw error;
          }

          toast.success(`Separação desfeita para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao desfazer separação:', error);
          toast.error("Erro ao desfazer separação");
        }
      },

      confirmarDespacho: async (pedidoId: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Despachado' } : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' })
            .eq('id', pedidoId);

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' } : p
              )
            }));
            throw error;
          }

          toast.success(`Despacho confirmado para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar despacho:', error);
          toast.error("Erro ao confirmar despacho");
        }
      },

      confirmarEntrega: async (pedidoId: string, observacao?: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) throw new Error('Pedido não encontrado');

          // Remover do estado local
          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId)
          }));

          // Reagendar para próxima entrega
          const { data: cliente } = await supabase
            .from('clientes')
            .select('periodicidade_padrao')
            .eq('id', pedido.cliente_id)
            .single();

          const proximaData = addDays(pedido.data_prevista_entrega, cliente?.periodicidade_padrao || 7);
          const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

          await supabase
            .from('agendamentos_clientes')
            .update({
              data_proxima_reposicao: proximaDataFormatada,
              status_agendamento: 'Previsto',
              substatus_pedido: 'Agendado'
            })
            .eq('id', pedidoId);

          toast.success(`Entrega confirmada para ${pedido.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar entrega:', error);
          toast.error("Erro ao confirmar entrega");
        }
      },

      confirmarRetorno: async (pedidoId: string, observacao?: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) throw new Error('Pedido não encontrado');

          // Remover do estado local
          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId)
          }));

          // Reagendar para próximo dia útil
          const proximaData = getProximoDiaUtil(pedido.data_prevista_entrega);
          const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

          await supabase
            .from('agendamentos_clientes')
            .update({
              data_proxima_reposicao: proximaDataFormatada,
              status_agendamento: 'Previsto',
              substatus_pedido: 'Agendado'
            })
            .eq('id', pedidoId);

          toast.success(`Retorno registrado para ${pedido.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar retorno:', error);
          toast.error("Erro ao confirmar retorno");
        }
      },

      marcarTodosSeparados: async (pedidos: PedidoExpedicao[]) => {
        try {
          const pedidosParaSeparar = pedidos.filter(p => 
            !p.substatus_pedido || p.substatus_pedido === 'Agendado'
          );
          
          if (pedidosParaSeparar.length === 0) {
            toast.error("Não há pedidos para separar");
            return;
          }

          set(state => ({
            pedidos: state.pedidos.map(p => 
              pedidosParaSeparar.some(ps => ps.id === p.id) 
                ? { ...p, substatus_pedido: 'Separado' } 
                : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' })
            .in('id', pedidosParaSeparar.map(p => p.id));

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                pedidosParaSeparar.some(ps => ps.id === p.id) 
                  ? { ...p, substatus_pedido: 'Agendado' } 
                  : p
              )
            }));
            throw error;
          }

          toast.success(`${pedidosParaSeparar.length} pedidos marcados como separados`);
        } catch (error) {
          console.error('Erro na separação em massa:', error);
          toast.error("Erro na separação em massa");
        }
      },

      confirmarDespachoEmMassa: async (pedidos: PedidoExpedicao[]) => {
        try {
          const pedidosParaDespachar = pedidos.filter(p => p.substatus_pedido === 'Separado');
          
          if (pedidosParaDespachar.length === 0) {
            toast.error("Não há pedidos separados para despachar");
            return;
          }

          set(state => ({
            pedidos: state.pedidos.map(p => 
              pedidosParaDespachar.some(pd => pd.id === p.id) 
                ? { ...p, substatus_pedido: 'Despachado' } 
                : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' })
            .in('id', pedidosParaDespachar.map(p => p.id));

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                pedidosParaDespachar.some(pd => pd.id === p.id) 
                  ? { ...p, substatus_pedido: 'Separado' } 
                  : p
              )
            }));
            throw error;
          }

          toast.success(`${pedidosParaDespachar.length} pedidos despachados`);
        } catch (error) {
          console.error('Erro no despacho em massa:', error);
          toast.error("Erro no despacho em massa");
        }
      },

      confirmarEntregaEmMassa: async (pedidos: PedidoExpedicao[]) => {
        try {
          const pedidosParaEntregar = pedidos.filter(p => 
            p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado'
          );
          
          if (pedidosParaEntregar.length === 0) {
            toast.error("Não há pedidos para entregar");
            return;
          }

          set(state => ({
            pedidos: state.pedidos.filter(p => 
              !pedidosParaEntregar.some(pe => pe.id === p.id)
            )
          }));

          for (const pedido of pedidosParaEntregar) {
            const { data: cliente } = await supabase
              .from('clientes')
              .select('periodicidade_padrao')
              .eq('id', pedido.cliente_id)
              .single();

            const proximaData = addDays(pedido.data_prevista_entrega, cliente?.periodicidade_padrao || 7);
            const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

            await supabase
              .from('agendamentos_clientes')
              .update({
                data_proxima_reposicao: proximaDataFormatada,
                status_agendamento: 'Previsto',
                substatus_pedido: 'Agendado'
              })
              .eq('id', pedido.id);
          }

          toast.success(`${pedidosParaEntregar.length} entregas confirmadas`);
        } catch (error) {
          console.error('Erro na entrega em massa:', error);
          toast.error("Erro na entrega em massa");
        }
      },

      confirmarRetornoEmMassa: async (pedidos: PedidoExpedicao[]) => {
        try {
          const pedidosParaRetorno = pedidos.filter(p => 
            p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado'
          );
          
          if (pedidosParaRetorno.length === 0) {
            toast.error("Não há pedidos para retorno");
            return;
          }

          set(state => ({
            pedidos: state.pedidos.filter(p => 
              !pedidosParaRetorno.some(pr => pr.id === p.id)
            )
          }));

          for (const pedido of pedidosParaRetorno) {
            const proximaData = getProximoDiaUtil(pedido.data_prevista_entrega);
            const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

            await supabase
              .from('agendamentos_clientes')
              .update({
                data_proxima_reposicao: proximaDataFormatada,
                status_agendamento: 'Previsto',
                substatus_pedido: 'Agendado'
              })
              .eq('id', pedido.id);
          }

          toast.success(`${pedidosParaRetorno.length} retornos registrados`);
        } catch (error) {
          console.error('Erro no retorno em massa:', error);
          toast.error("Erro no retorno em massa");
        }
      },

      getPedidosParaSeparacao: () => {
        const hoje = new Date();
        const hojeFormatado = format(hoje, 'yyyy-MM-dd');
        
        return get().pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' && 
                 (!p.substatus_pedido || p.substatus_pedido === 'Agendado') &&
                 dataEntregaFormatada === hojeFormatado;
        });
      },

      getPedidosParaDespacho: () => {
        const hoje = new Date();
        const hojeFormatado = format(hoje, 'yyyy-MM-dd');
        
        return get().pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' &&
                 (p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado') &&
                 dataEntregaFormatada === hojeFormatado;
        });
      },

      getPedidosProximoDia: () => {
        const hoje = new Date();
        const proximoDiaUtil = getProximoDiaUtil(hoje);
        const proximoDiaStr = format(proximoDiaUtil, 'yyyy-MM-dd');
        
        return get().pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' &&
                 dataEntregaFormatada === proximoDiaStr;
        });
      },

      getPedidosAtrasados: () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = format(ontem, 'yyyy-MM-dd');
        
        return get().pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' &&
                 dataEntregaFormatada <= ontemStr &&
                 p.substatus_pedido !== 'Entregue' && 
                 p.substatus_pedido !== 'Retorno';
        });
      }
    }),
    { name: 'expedicao-store' }
  )
);
