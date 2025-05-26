import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SubstatusPedidoAgendado } from '@/types';
import { addBusinessDays, isWeekend, format } from 'date-fns';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';

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
  lastSyncTime: number;
  
  // Actions
  carregarPedidos: () => Promise<void>;
  confirmarSeparacao: (pedidoId: string) => Promise<void>;
  desfazerSeparacao: (pedidoId: string) => Promise<void>;
  confirmarDespacho: (pedidoId: string) => Promise<void>;
  confirmarEntrega: (pedidoId: string, observacao?: string) => Promise<void>;
  confirmarRetorno: (pedidoId: string, observacao?: string) => Promise<void>;
  marcarTodosSeparados: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarDespachoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  
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

export const useExpedicaoStore = create<ExpedicaoStore>()(
  devtools(
    (set, get) => ({
      pedidos: [],
      isLoading: false,
      lastSyncTime: 0,
      
      carregarPedidos: async () => {
        const currentTime = Date.now();
        const { lastSyncTime } = get();
        
        // Evitar chamadas muito frequentes (menos de 1000ms)
        if (currentTime - lastSyncTime < 1000) {
          console.log('⏭️ Pulando carregamento - muito recente');
          return;
        }
        
        set({ isLoading: true, lastSyncTime: currentTime });
        try {
          // Usar dados do store de agendamento sem recarregar
          const agendamentos = useAgendamentoClienteStore.getState().agendamentos;
          
          console.log('📋 Usando agendamentos carregados:', agendamentos.length);
          
          if (agendamentos.length === 0) {
            console.log('📥 Carregando agendamentos iniciais...');
            await useAgendamentoClienteStore.getState().carregarTodosAgendamentos();
            const novosAgendamentos = useAgendamentoClienteStore.getState().agendamentos;
            await formatarPedidos(novosAgendamentos);
          } else {
            await formatarPedidos(agendamentos);
          }

        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
          toast.error("Erro ao carregar pedidos");
        } finally {
          set({ isLoading: false });
        }
      },

      confirmarSeparacao: async (pedidoId: string) => {
        try {
          // 1. Atualizar estado local IMEDIATAMENTE
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' } : p
            )
          }));

          const pedido = get().pedidos.find(p => p.id === pedidoId);
          console.log('🔄 Confirmando separação para:', pedido?.cliente_nome);

          // 2. Salvar no banco
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' } as any)
            .eq('id', pedidoId);

          if (error) {
            console.error('❌ Erro ao salvar separação:', error);
            
            // Reverter estado local em caso de erro
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' } : p
              )
            }));
            
            throw error;
          }

          console.log('✅ Separação salva no banco');

          // 3. Atualizar store de agendamento SEM recarregar tudo
          const agendamentoStore = useAgendamentoClienteStore.getState();
          const agendamentosAtualizados = agendamentoStore.agendamentos.map(ag => 
            ag.id === pedidoId 
              ? { ...ag, substatus_pedido: 'Separado' as any }
              : ag
          );
          
          // Atualizar diretamente o estado do agendamento
          useAgendamentoClienteStore.setState({ agendamentos: agendamentosAtualizados });

          toast.success(`Separação confirmada para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar separação:', error);
          toast.error("Erro ao confirmar separação");
        }
      },

      desfazerSeparacao: async (pedidoId: string) => {
        try {
          // 1. Atualizar estado local IMEDIATAMENTE
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' } : p
            )
          }));

          // 2. Salvar no banco
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Agendado' } as any)
            .eq('id', pedidoId);

          if (error) {
            // Reverter estado local em caso de erro
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' } : p
              )
            }));
            throw error;
          }

          // 3. Atualizar store de agendamento
          const agendamentoStore = useAgendamentoClienteStore.getState();
          const agendamentosAtualizados = agendamentoStore.agendamentos.map(ag => 
            ag.id === pedidoId 
              ? { ...ag, substatus_pedido: 'Agendado' as any }
              : ag
          );
          
          useAgendamentoClienteStore.setState({ agendamentos: agendamentosAtualizados });

          const pedido = get().pedidos.find(p => p.id === pedidoId);
          toast.success(`Separação desfeita para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao desfazer separação:', error);
          toast.error("Erro ao desfazer separação");
        }
      },

      confirmarDespacho: async (pedidoId: string) => {
        try {
          // 1. Atualizar estado local IMEDIATAMENTE
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Despachado' } : p
            )
          }));

          // 2. Salvar no banco
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' } as any)
            .eq('id', pedidoId);

          if (error) {
            // Reverter estado local em caso de erro
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' } : p
              )
            }));
            throw error;
          }

          // 3. Atualizar store de agendamento
          const agendamentoStore = useAgendamentoClienteStore.getState();
          const agendamentosAtualizados = agendamentoStore.agendamentos.map(ag => 
            ag.id === pedidoId 
              ? { ...ag, substatus_pedido: 'Despachado' as any }
              : ag
          );
          
          useAgendamentoClienteStore.setState({ agendamentos: agendamentosAtualizados });

          const pedido = get().pedidos.find(p => p.id === pedidoId);
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

          // 1. Atualizar substatus para Entregue e status para Reagendar
          const { error: updateError } = await supabase
            .from('agendamentos_clientes')
            .update({ 
              substatus_pedido: 'Entregue',
              status_agendamento: 'Reagendar'
            } as any)
            .eq('id', pedidoId);

          if (updateError) throw updateError;

          // 2. Buscar dados do cliente para criar novo agendamento
          const { data: cliente, error: clienteError } = await supabase
            .from('clientes')
            .select('*')
            .eq('id', pedido.cliente_id)
            .single();

          if (clienteError) throw clienteError;

          // 3. Calcular próxima data de reposição
          const proximaData = addBusinessDays(new Date(), cliente.periodicidade_padrao || 7);

          // 4. Criar novo agendamento
          const { error: novoAgendamentoError } = await supabase
            .from('agendamentos_clientes')
            .insert({
              cliente_id: pedido.cliente_id,
              data_proxima_reposicao: proximaData.toISOString().split('T')[0],
              quantidade_total: pedido.quantidade_total,
              tipo_pedido: pedido.tipo_pedido,
              status_agendamento: 'Previsto',
              itens_personalizados: pedido.itens_personalizados,
              substatus_pedido: 'Agendado'
            } as any);

          if (novoAgendamentoError) throw novoAgendamentoError;

          // 5. Atualizar cliente
          const { error: clienteUpdateError } = await supabase
            .from('clientes')
            .update({ 
              ultima_data_reposicao_efetiva: new Date().toISOString().split('T')[0],
              proxima_data_reposicao: proximaData.toISOString().split('T')[0],
              status_agendamento: 'Previsto'
            })
            .eq('id', pedido.cliente_id);

          if (clienteUpdateError) throw clienteUpdateError;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { 
                ...p, 
                substatus_pedido: 'Entregue',
                status_agendamento: 'Reagendar'
              } : p
            )
          }));

          toast.success(`Entrega confirmada para ${pedido.cliente_nome}. Novo agendamento criado.`);
          
          // Recarregar pedidos para mostrar o novo agendamento
          setTimeout(() => get().carregarPedidos(), 1000);
        } catch (error) {
          console.error('Erro ao confirmar entrega:', error);
          toast.error("Erro ao confirmar entrega");
        }
      },

      confirmarRetorno: async (pedidoId: string, observacao?: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) throw new Error('Pedido não encontrado');

          // 1. Atualizar substatus para Retorno e status para Reagendar
          const { error: updateError } = await supabase
            .from('agendamentos_clientes')
            .update({ 
              substatus_pedido: 'Retorno',
              status_agendamento: 'Reagendar'
            } as any)
            .eq('id', pedidoId);

          if (updateError) throw updateError;

          // 2. Calcular próximo dia útil
          const proximoDiaUtil = getProximoDiaUtil(new Date());

          // 3. Criar novo agendamento para o próximo dia útil
          const { error: novoAgendamentoError } = await supabase
            .from('agendamentos_clientes')
            .insert({
              cliente_id: pedido.cliente_id,
              data_proxima_reposicao: proximoDiaUtil.toISOString().split('T')[0],
              quantidade_total: pedido.quantidade_total,
              tipo_pedido: pedido.tipo_pedido,
              status_agendamento: 'Previsto',
              itens_personalizados: pedido.itens_personalizados,
              substatus_pedido: 'Agendado'
            } as any);

          if (novoAgendamentoError) throw novoAgendamentoError;

          // 4. Atualizar cliente
          const { error: clienteUpdateError } = await supabase
            .from('clientes')
            .update({ 
              proxima_data_reposicao: proximoDiaUtil.toISOString().split('T')[0],
              status_agendamento: 'Previsto'
            })
            .eq('id', pedido.cliente_id);

          if (clienteUpdateError) throw clienteUpdateError;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { 
                ...p, 
                substatus_pedido: 'Retorno',
                status_agendamento: 'Reagendar'
              } : p
            )
          }));

          toast.success(`Retorno registrado para ${pedido.cliente_nome}. Reagendado para ${proximoDiaUtil.toLocaleDateString()}.`);
          
          // Recarregar pedidos
          setTimeout(() => get().carregarPedidos(), 1000);
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

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' } as any)
            .in('id', pedidosParaSeparar.map(p => p.id));

          if (error) throw error;

          set(state => ({
            pedidos: state.pedidos.map(p => 
              pedidosParaSeparar.some(ps => ps.id === p.id) 
                ? { ...p, substatus_pedido: 'Separado' } 
                : p
            )
          }));

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

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' } as any)
            .in('id', pedidosParaDespachar.map(p => p.id));

          if (error) throw error;

          set(state => ({
            pedidos: state.pedidos.map(p => 
              pedidosParaDespachar.some(pd => pd.id === p.id) 
                ? { ...p, substatus_pedido: 'Despachado' } 
                : p
            )
          }));

          toast.success(`${pedidosParaDespachar.length} pedidos despachados`);
        } catch (error) {
          console.error('Erro no despacho em massa:', error);
          toast.error("Erro no despacho em massa");
        }
      },

      getPedidosParaSeparacao: () => {
        const hoje = format(new Date(), 'yyyy-MM-dd');
        console.log('🔍 getPedidosParaSeparacao - Data de hoje:', hoje);
        
        const todosPedidos = get().pedidos;
        console.log('📋 Total de pedidos carregados:', todosPedidos.length);
        
        const pedidosFiltrados = todosPedidos.filter(p => {
          const dataEntrega = format(new Date(p.data_prevista_entrega), 'yyyy-MM-dd');
          
          const isStatusAgendado = p.status_agendamento === 'Agendado';
          const isSubstatusValido = !p.substatus_pedido || p.substatus_pedido === 'Agendado';
          const isDataHoje = dataEntrega === hoje;
          
          console.log(`📦 Pedido ${p.cliente_nome}:`, {
            dataEntrega,
            hoje,
            status: p.status_agendamento,
            substatus: p.substatus_pedido,
            isStatusAgendado,
            isSubstatusValido,
            isDataHoje,
            incluir: isStatusAgendado && isSubstatusValido && isDataHoje
          });
          
          return isStatusAgendado && isSubstatusValido && isDataHoje;
        });
        
        console.log('✅ Pedidos filtrados para separação:', pedidosFiltrados.length);
        return pedidosFiltrados;
      },

      getPedidosParaDespacho: () => {
        const hoje = format(new Date(), 'yyyy-MM-dd');
        console.log('🚚 getPedidosParaDespacho - Data de hoje:', hoje);
        
        const todosPedidos = get().pedidos;
        const pedidosFiltrados = todosPedidos.filter(p => {
          const dataEntrega = format(new Date(p.data_prevista_entrega), 'yyyy-MM-dd');
          
          const isStatusAgendado = p.status_agendamento === 'Agendado';
          const isSubstatusValido = p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado';
          const isDataHoje = dataEntrega === hoje;
          
          console.log(`🚛 Pedido ${p.cliente_nome}:`, {
            dataEntrega,
            hoje,
            status: p.status_agendamento,
            substatus: p.substatus_pedido,
            isStatusAgendado,
            isSubstatusValido,
            isDataHoje,
            incluir: isStatusAgendado && isSubstatusValido && isDataHoje
          });
          
          return isStatusAgendado && isSubstatusValido && isDataHoje;
        });
        
        console.log('✅ Pedidos para despacho:', pedidosFiltrados.length);
        return pedidosFiltrados;
      },

      getPedidosProximoDia: () => {
        const hoje = new Date();
        const proximoDiaUtil = getProximoDiaUtil(hoje);
        const proximoDiaStr = format(proximoDiaUtil, 'yyyy-MM-dd');
        
        console.log('📅 getPedidosProximoDia - Próximo dia útil:', proximoDiaStr);
        
        const todosPedidos = get().pedidos;
        const pedidosFiltrados = todosPedidos.filter(p => {
          const dataEntrega = format(new Date(p.data_prevista_entrega), 'yyyy-MM-dd');
          
          const isStatusAgendado = p.status_agendamento === 'Agendado';
          const isDataProximoDia = dataEntrega === proximoDiaStr;
          
          console.log(`📅 Pedido ${p.cliente_nome}:`, {
            dataEntrega,
            proximoDiaStr,
            status: p.status_agendamento,
            isStatusAgendado,
            isDataProximoDia,
            incluir: isStatusAgendado && isDataProximoDia
          });
          
          return isStatusAgendado && isDataProximoDia;
        });
        
        console.log('✅ Pedidos próximo dia:', pedidosFiltrados.length);
        return pedidosFiltrados;
      },

      getPedidosAtrasados: () => {
        const hoje = new Date();
        const ontem = new Date(hoje);
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = format(ontem, 'yyyy-MM-dd');
        
        console.log('⏰ getPedidosAtrasados - Data limite (ontem):', ontemStr);
        
        const todosPedidos = get().pedidos;
        const pedidosFiltrados = todosPedidos.filter(p => {
          const dataEntrega = format(new Date(p.data_prevista_entrega), 'yyyy-MM-dd');
          
          const isStatusAgendado = p.status_agendamento === 'Agendado';
          const isAtrasado = dataEntrega <= ontemStr;
          const naoFinalizado = p.substatus_pedido !== 'Entregue' && p.substatus_pedido !== 'Retorno';
          
          console.log(`⏰ Pedido ${p.cliente_nome}:`, {
            dataEntrega,
            ontemStr,
            status: p.status_agendamento,
            substatus: p.substatus_pedido,
            isStatusAgendado,
            isAtrasado,
            naoFinalizado,
            incluir: isStatusAgendado && isAtrasado && naoFinalizado
          });
          
          return isStatusAgendado && isAtrasado && naoFinalizado;
        });
        
        console.log('✅ Pedidos atrasados:', pedidosFiltrados.length);
        return pedidosFiltrados;
      }
    }),
    { name: 'expedicao-store' }
  )
);

// Função auxiliar para formatar pedidos (extraída para evitar repetição)
async function formatarPedidos(agendamentos: any[]) {
  // Carregar dados dos clientes para complementar as informações
  const { data: clientes, error: clientesError } = await supabase
    .from('clientes')
    .select('id, nome, endereco_entrega, contato_telefone');

  if (clientesError) throw clientesError;

  const clientesMap = new Map(clientes?.map(c => [c.id, c]) || []);

  const pedidosFormatados = agendamentos
    .filter(agendamento => agendamento.status_agendamento === 'Agendado')
    .map(agendamento => {
      const cliente = clientesMap.get(agendamento.cliente_id);
      
      // MAPEAMENTO CORRETO DO SUBSTATUS
      const substatus = (agendamento as any).substatus_pedido || 'Agendado';
      
      console.log(`📦 Formatando pedido ${agendamento.id}:`, {
        cliente_nome: cliente?.nome,
        substatus_original: (agendamento as any).substatus_pedido,
        substatus_mapeado: substatus,
        data_prevista: agendamento.data_proxima_reposicao
      });
      
      return {
        id: agendamento.id,
        cliente_id: agendamento.cliente_id,
        cliente_nome: cliente?.nome || 'Cliente não encontrado',
        cliente_endereco: cliente?.endereco_entrega,
        cliente_telefone: cliente?.contato_telefone,
        data_prevista_entrega: agendamento.data_proxima_reposicao || new Date(),
        quantidade_total: agendamento.quantidade_total,
        tipo_pedido: agendamento.tipo_pedido,
        status_agendamento: agendamento.status_agendamento,
        substatus_pedido: substatus as SubstatusPedidoAgendado,
        itens_personalizados: agendamento.itens_personalizados,
        created_at: agendamento.created_at
      };
    });

  console.log('✅ Pedidos formatados para expedição:', pedidosFormatados.length);
  console.log('📊 Substatus dos pedidos:', pedidosFormatados.map(p => ({
    id: p.id,
    cliente: p.cliente_nome,
    substatus: p.substatus_pedido
  })));
  
  // Atualizar o estado do store
  useExpedicaoStore.setState({ pedidos: pedidosFormatados });
}
