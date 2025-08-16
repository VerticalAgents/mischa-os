import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SubstatusPedidoAgendado } from '@/types';
import { addBusinessDays, isWeekend, format, addDays, isBefore, startOfDay } from 'date-fns';
import { useHistoricoEntregasStore } from './useHistoricoEntregasStore';
import { useConfirmacaoEntrega } from './useConfirmacaoEntrega';

interface PedidoExpedicao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  link_google_maps?: string;
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
  ultimaAtualizacao: Date | null;
  // FASE 1: Proteções anti-loop
  operationsInProgress: Set<string>;
  
  // Actions
  carregarPedidos: () => Promise<void>;
  atualizarDataReferencia: () => Promise<void>;
  confirmarSeparacao: (pedidoId: string) => Promise<void>;
  desfazerSeparacao: (pedidoId: string) => Promise<void>;
  retornarParaSeparacao: (pedidoId: string) => Promise<void>;
  confirmarDespacho: (pedidoId: string) => Promise<void>;
  confirmarEntrega: (pedidoId: string, observacao?: string) => Promise<void>;
  confirmarRetorno: (pedidoId: string, observacao?: string) => Promise<void>;
  marcarTodosSeparados: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarDespachoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarEntregaEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarRetornoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  
  // FASE 1: Helpers para proteção
  isOperationInProgress: (pedidoId: string) => boolean;
  startOperation: (pedidoId: string) => void;
  finishOperation: (pedidoId: string) => void;
  
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

// Função para parsing de data que preserva o fuso horário local
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
      ultimaAtualizacao: null,
      // FASE 1: Inicializar proteções
      operationsInProgress: new Set(),
      
      // FASE 1: Helpers para proteção anti-loop
      isOperationInProgress: (pedidoId: string) => {
        return get().operationsInProgress.has(pedidoId);
      },
      
      startOperation: (pedidoId: string) => {
        set(state => ({
          operationsInProgress: new Set([...state.operationsInProgress, pedidoId])
        }));
      },
      
      finishOperation: (pedidoId: string) => {
        set(state => {
          const newSet = new Set(state.operationsInProgress);
          newSet.delete(pedidoId);
          return { operationsInProgress: newSet };
        });
      },
      
      atualizarDataReferencia: async () => {
        console.log('🔄 Atualizando data de referência para hoje...');
        await get().carregarPedidos();
        set({ ultimaAtualizacao: new Date() });
        toast.success("Data de referência atualizada com sucesso!");
      },
      
      carregarPedidos: async () => {
        // FASE 1: Validação para evitar múltiplas chamadas simultâneas
        if (get().isLoading) {
          console.log('⚠️ Carregamento já em andamento, ignorando nova solicitação');
          return;
        }

        set({ isLoading: true });
        
        try {
          console.log('🔄 Carregando agendamentos para expedição...');
          
          const { data: agendamentos, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('status_agendamento', 'Agendado');

          if (error) {
            console.error('Erro ao carregar agendamentos:', error);
            throw error;
          }

          console.log('📥 Agendamentos carregados:', agendamentos?.length || 0);

          // Tentar carregar dados dos clientes com link_google_maps
          let clientesData: any[] = [];
          
          try {
            const { data: clientesComLink, error: clientesError } = await supabase
              .from('clientes')
              .select('id, nome, endereco_entrega, contato_telefone, link_google_maps');

            if (clientesError) {
              console.warn('Coluna link_google_maps não encontrada, carregando sem ela:', clientesError);
              
              const { data: clientesSemLink, error: fallbackError } = await supabase
                .from('clientes')
                .select('id, nome, endereco_entrega, contato_telefone');

              if (fallbackError) {
                throw fallbackError;
              }

              clientesData = clientesSemLink || [];
            } else {
              clientesData = clientesComLink || [];
            }
          } catch (fallbackError) {
            console.error('Erro ao carregar dados dos clientes:', fallbackError);
            clientesData = [];
          }

          const clientesMap = new Map(clientesData.map(c => [c.id, c]));

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
              link_google_maps: cliente?.link_google_maps,
              data_prevista_entrega: dataPrevisao,
              quantidade_total: agendamento.quantidade_total || 0,
              tipo_pedido: agendamento.tipo_pedido || 'Padrão',
              status_agendamento: agendamento.status_agendamento,
              substatus_pedido: (agendamento.substatus_pedido || 'Agendado') as SubstatusPedidoAgendado,
              itens_personalizados: agendamento.itens_personalizados,
              created_at: agendamento.created_at ? new Date(agendamento.created_at) : new Date()
            };
          });

          console.log('✅ Pedidos formatados para expedição:', pedidosFormatados.length);
          set({ 
            pedidos: pedidosFormatados,
            ultimaAtualizacao: new Date()
          });
          
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
          toast.error("Erro ao carregar pedidos");
        } finally {
          set({ isLoading: false });
        }
      },

      confirmarSeparacao: async (pedidoId: string) => {
        // FASE 1: Proteção anti-loop
        if (get().isOperationInProgress(pedidoId)) {
          console.log(`⚠️ Operação já em andamento para pedido ${pedidoId}`);
          return;
        }

        try {
          get().startOperation(pedidoId);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          // FASE 3: Validação de estado
          if (!pedido) {
            console.error(`❌ Pedido ${pedidoId} não encontrado`);
            return;
          }
          
          if (pedido.substatus_pedido === 'Separado') {
            console.log(`⚠️ Pedido ${pedidoId} já está separado`);
            return;
          }

          console.log(`🔄 Confirmando separação para pedido ${pedidoId}`);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' })
            .eq('id', pedidoId);

          if (error) {
            // FASE 3: Rollback correto
            console.error(`❌ Erro ao confirmar separação para ${pedidoId}:`, error);
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: pedido.substatus_pedido } : p
              )
            }));
            throw error;
          }

          console.log(`✅ Separação confirmada para ${pedido.cliente_nome}`);
          toast.success(`Separação confirmada para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar separação:', error);
          toast.error("Erro ao confirmar separação");
        } finally {
          get().finishOperation(pedidoId);
        }
      },

      desfazerSeparacao: async (pedidoId: string) => {
        // FASE 1: Proteção anti-loop
        if (get().isOperationInProgress(pedidoId)) {
          console.log(`⚠️ Operação já em andamento para pedido ${pedidoId}`);
          return;
        }

        try {
          get().startOperation(pedidoId);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          // FASE 3: Validação de estado
          if (!pedido) {
            console.error(`❌ Pedido ${pedidoId} não encontrado`);
            return;
          }
          
          if (pedido.substatus_pedido !== 'Separado') {
            console.log(`⚠️ Pedido ${pedidoId} não está separado`);
            return;
          }

          console.log(`🔄 Desfazendo separação para pedido ${pedidoId}`);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' as SubstatusPedidoAgendado } : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Agendado' })
            .eq('id', pedidoId);

          if (error) {
            // FASE 3: Rollback correto
            console.error(`❌ Erro ao desfazer separação para ${pedidoId}:`, error);
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } : p
              )
            }));
            throw error;
          }

          console.log(`✅ Separação desfeita para ${pedido.cliente_nome}`);
          toast.success(`Separação desfeita para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao desfazer separação:', error);
          toast.error("Erro ao desfazer separação");
        } finally {
          get().finishOperation(pedidoId);
        }
      },

      retornarParaSeparacao: async (pedidoId: string) => {
        // FASE 1: Proteção anti-loop CRÍTICA
        if (get().isOperationInProgress(pedidoId)) {
          console.log(`⚠️ OPERAÇÃO JÁ EM ANDAMENTO para pedido ${pedidoId} - IGNORANDO`);
          return;
        }

        try {
          get().startOperation(pedidoId);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          // FASE 3: Validações de estado CRÍTICAS
          if (!pedido) {
            console.error(`❌ ERRO CRÍTICO: Pedido ${pedidoId} não encontrado`);
            return;
          }
          
          if (pedido.substatus_pedido === 'Agendado') {
            console.log(`⚠️ Pedido ${pedidoId} já está como Agendado - operação desnecessária`);
            return;
          }
          
          if (pedido.substatus_pedido !== 'Despachado') {
            console.log(`⚠️ Pedido ${pedidoId} não está despachado (status: ${pedido.substatus_pedido})`);
            return;
          }

          console.log(`🔄 RETORNANDO PARA SEPARAÇÃO: ${pedidoId} - Cliente: ${pedido.cliente_nome}`);
          
          // FASE 3: Armazenar estado anterior para rollback
          const estadoAnterior = pedido.substatus_pedido;
          
          // Atualiza o estado local primeiro
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' as SubstatusPedidoAgendado } : p
            )
          }));

          // Atualiza no banco de dados
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Agendado' })
            .eq('id', pedidoId);

          if (error) {
            // FASE 3: Rollback correto com estado anterior
            console.error(`❌ ERRO ao retornar para separação ${pedidoId}:`, error);
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: estadoAnterior } : p
              )
            }));
            throw error;
          }

          console.log(`✅ SUCESSO: ${pedido.cliente_nome} retornado para separação`);
          toast.success(`${pedido?.cliente_nome} retornado para separação`);
        } catch (error) {
          console.error('❌ ERRO CRÍTICO ao retornar para separação:', error);
          toast.error("Erro ao retornar pedido para separação");
        } finally {
          // FASE 1: SEMPRE finalizar operação
          get().finishOperation(pedidoId);
          console.log(`🏁 Operação finalizada para pedido ${pedidoId}`);
        }
      },

      confirmarDespacho: async (pedidoId: string) => {
        // FASE 1: Proteção anti-loop
        if (get().isOperationInProgress(pedidoId)) {
          console.log(`⚠️ Operação já em andamento para pedido ${pedidoId}`);
          return;
        }

        try {
          get().startOperation(pedidoId);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          // FASE 3: Validação de estado
          if (!pedido) {
            console.error(`❌ Pedido ${pedidoId} não encontrado`);
            return;
          }
          
          if (pedido.substatus_pedido !== 'Separado') {
            console.log(`⚠️ Pedido ${pedidoId} não está separado`);
            return;
          }

          console.log(`🔄 Confirmando despacho para pedido ${pedidoId}`);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Despachado' as SubstatusPedidoAgendado } : p
            )
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' })
            .eq('id', pedidoId);

          if (error) {
            // FASE 3: Rollback correto
            console.error(`❌ Erro ao confirmar despacho para ${pedidoId}:`, error);
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } : p
              )
            }));
            throw error;
          }

          console.log(`✅ Despacho confirmado para ${pedido.cliente_nome}`);
          toast.success(`Despacho confirmado para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao confirmar despacho:', error);
          toast.error("Erro ao confirmar despacho");
        } finally {
          get().finishOperation(pedidoId);
        }
      },

      confirmarEntrega: async (pedidoId: string, observacao?: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) throw new Error('Pedido não encontrado');

          if (pedido.substatus_pedido !== 'Despachado') {
            toast.error("Pedido deve estar despachado para confirmar entrega");
            return;
          }

          console.log('🚚 Processando entrega com validação de estoque:', {
            pedidoId,
            tipoPedido: pedido.tipo_pedido,
            itensPersonalizados: !!pedido.itens_personalizados,
            dataPrevistaEntrega: pedido.data_prevista_entrega
          });

          const { confirmarEntrega } = useConfirmacaoEntrega();
          const entregaConfirmada = await confirmarEntrega(pedido, observacao);
          
          if (!entregaConfirmada) {
            console.log('❌ Entrega não foi confirmada devido a problemas de estoque');
            return;
          }

          const historicoStore = useHistoricoEntregasStore.getState();
          const dataEntrega = pedido.data_prevista_entrega;
          
          console.log('📝 Criando NOVO registro de entrega no histórico com data prevista:', dataEntrega);
          await historicoStore.adicionarRegistro({
            cliente_id: pedido.cliente_id,
            cliente_nome: pedido.cliente_nome,
            data: dataEntrega,
            tipo: 'entrega',
            quantidade: pedido.quantidade_total,
            itens: pedido.itens_personalizados || [],
            status_anterior: pedido.substatus_pedido || 'Agendado',
            observacao: observacao || undefined
          });

          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId)
          }));

          const { data: cliente } = await supabase
            .from('clientes')
            .select('periodicidade_padrao')
            .eq('id', pedido.cliente_id)
            .single();

          const proximaData = addDays(dataEntrega, cliente?.periodicidade_padrao || 7);
          const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

          const dadosAtualizacao: any = {
            data_proxima_reposicao: proximaDataFormatada,
            status_agendamento: 'Previsto',
            substatus_pedido: 'Agendado'
          };

          if (pedido.tipo_pedido === 'Alterado') {
            dadosAtualizacao.tipo_pedido = 'Alterado';
            if (pedido.itens_personalizados) {
              dadosAtualizacao.itens_personalizados = pedido.itens_personalizados;
            }
            console.log('✅ Preservando configuração alterada no reagendamento:', {
              tipo_pedido: dadosAtualizacao.tipo_pedido,
              itens_personalizados: !!dadosAtualizacao.itens_personalizados
            });
          } else {
            dadosAtualizacao.tipo_pedido = 'Padrão';
          }

          await supabase
            .from('agendamentos_clientes')
            .update(dadosAtualizacao)
            .eq('id', pedidoId);

          console.log('✅ Entrega confirmada com baixa no estoque - NOVO registro criado no histórico com data prevista');
          toast.success(`Entrega confirmada para ${pedido.cliente_nome} na data ${format(dataEntrega, 'dd/MM/yyyy')} com baixa automática no estoque. Reagendado como Previsto preservando configurações.`);
        } catch (error) {
          console.error('❌ Erro ao confirmar entrega:', error);
          toast.error("Erro ao confirmar entrega");
        }
      },

      confirmarRetorno: async (pedidoId: string, observacao?: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) throw new Error('Pedido não encontrado');

          if (pedido.substatus_pedido !== 'Despachado') {
            toast.error("Pedido deve estar despachado para confirmar retorno");
            return;
          }

          console.log('🔄 Processando retorno com preservação de dados:', {
            pedidoId,
            tipoPedido: pedido.tipo_pedido,
            itensPersonalizados: !!pedido.itens_personalizados,
            dataPrevistaEntrega: pedido.data_prevista_entrega
          });

          const historicoStore = useHistoricoEntregasStore.getState();
          const dataRetorno = pedido.data_prevista_entrega;
          
          console.log('📝 Criando NOVO registro de retorno no histórico com data prevista:', dataRetorno);
          await historicoStore.adicionarRegistro({
            cliente_id: pedido.cliente_id,
            cliente_nome: pedido.cliente_nome,
            data: dataRetorno,
            tipo: 'retorno',
            quantidade: pedido.quantidade_total,
            itens: pedido.itens_personalizados || [],
            status_anterior: pedido.substatus_pedido || 'Agendado',
            observacao: observacao || undefined
          });

          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId)
          }));

          const proximaData = getProximoDiaUtil(dataRetorno);
          const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

          const dadosAtualizacao: any = {
            data_proxima_reposicao: proximaDataFormatada,
            status_agendamento: 'Previsto',
            substatus_pedido: 'Agendado'
          };

          if (pedido.tipo_pedido === 'Alterado') {
            dadosAtualizacao.tipo_pedido = 'Alterado';
            if (pedido.itens_personalizados) {
              dadosAtualizacao.itens_personalizados = pedido.itens_personalizados;
            }
            console.log('✅ Preservando configuração alterada no retorno:', {
              tipo_pedido: dadosAtualizacao.tipo_pedido,
              itens_personalizados: !!dadosAtualizacao.itens_personalizados
            });
          } else {
            dadosAtualizacao.tipo_pedido = 'Padrão';
          }

          await supabase
            .from('agendamentos_clientes')
            .update(dadosAtualizacao)
            .eq('id', pedidoId);

          console.log('✅ Retorno confirmado - NOVO registro criado no histórico com data prevista');
          toast.success(`Retorno registrado para ${pedido.cliente_nome} na data ${format(dataRetorno, 'dd/MM/yyyy')}. Reagendado como Previsto preservando configurações.`);
        } catch (error) {
          console.error('❌ Erro ao confirmar retorno:', error);
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
                ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } 
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
                  ? { ...p, substatus_pedido: 'Agendado' as SubstatusPedidoAgendado } 
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
                ? { ...p, substatus_pedido: 'Despachado' as SubstatusPedidoAgendado } 
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
                  ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } 
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
          const pedidosParaEntregar = pedidos.filter(p => p.substatus_pedido === 'Despachado');
          
          if (pedidosParaEntregar.length === 0) {
            toast.error("Não há pedidos despachados para entregar");
            return;
          }

          console.log('🚚 Processando entregas em massa com validação de estoque - criando registros no histórico...');
          
          const { confirmarEntregaEmMassa } = useConfirmacaoEntrega();
          const entregasConfirmadas = await confirmarEntregaEmMassa(pedidosParaEntregar);
          
          if (!entregasConfirmadas) {
            console.log('❌ Entregas em massa não foram confirmadas devido a problemas de estoque');
            return;
          }

          const historicoStore = useHistoricoEntregasStore.getState();
          
          set(state => ({
            pedidos: state.pedidos.filter(p => 
              !pedidosParaEntregar.some(pe => pe.id === p.id)
            )
          }));

          for (const pedido of pedidosParaEntregar) {
            console.log(`📝 Criando registro de entrega para ${pedido.cliente_nome}...`);
            
            const dataEntrega = pedido.data_prevista_entrega;
            
            await historicoStore.adicionarRegistro({
              cliente_id: pedido.cliente_id,
              cliente_nome: pedido.cliente_nome,
              data: dataEntrega,
              tipo: 'entrega',
              quantidade: pedido.quantidade_total,
              itens: pedido.itens_personalizados || [],
              status_anterior: pedido.substatus_pedido || 'Agendado'
            });

            const { data: cliente } = await supabase
              .from('clientes')
              .select('periodicidade_padrao')
              .eq('id', pedido.cliente_id)
              .single();

            const proximaData = addDays(dataEntrega, cliente?.periodicidade_padrao || 7);
            const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

            const dadosAtualizacao: any = {
              data_proxima_reposicao: proximaDataFormatada,
              status_agendamento: 'Previsto',
              substatus_pedido: 'Agendado'
            };

            if (pedido.tipo_pedido === 'Alterado') {
              dadosAtualizacao.tipo_pedido = 'Alterado';
              if (pedido.itens_personalizados) {
                dadosAtualizacao.itens_personalizados = pedido.itens_personalizados;
              }
            } else {
              dadosAtualizacao.tipo_pedido = 'Padrão';
            }

            await supabase
              .from('agendamentos_clientes')
              .update(dadosAtualizacao)
              .eq('id', pedido.id);
          }

          console.log(`✅ ${pedidosParaEntregar.length} entregas confirmadas com baixa automática no estoque - NOVOS registros criados no histórico com datas previstas`);
          toast.success(`${pedidosParaEntregar.length} entregas confirmadas nas respectivas datas previstas com baixa automática no estoque e reagendadas como Previsto`);
        } catch (error) {
          console.error('❌ Erro na entrega em massa:', error);
          toast.error("Erro na entrega em massa");
        }
      },

      confirmarRetornoEmMassa: async (pedidos: PedidoExpedicao[]) => {
        try {
          const pedidosParaRetorno = pedidos.filter(p => p.substatus_pedido === 'Despachado');
          
          if (pedidosParaRetorno.length === 0) {
            toast.error("Não há pedidos despachados para retorno");
            return;
          }

          console.log('🔄 Processando retornos em massa - criando registros no histórico...');

          const historicoStore = useHistoricoEntregasStore.getState();

          set(state => ({
            pedidos: state.pedidos.filter(p => 
              !pedidosParaRetorno.some(pr => pr.id === p.id)
            )
          }));

          for (const pedido of pedidosParaRetorno) {
            console.log(`📝 Criando registro de retorno para ${pedido.cliente_nome}...`);
            
            const dataRetorno = pedido.data_prevista_entrega;
            
            await historicoStore.adicionarRegistro({
              cliente_id: pedido.cliente_id,
              cliente_nome: pedido.cliente_nome,
              data: dataRetorno,
              tipo: 'retorno',
              quantidade: pedido.quantidade_total,
              itens: pedido.itens_personalizados || [],
              status_anterior: pedido.substatus_pedido || 'Agendado'
            });

            const proximaData = getProximoDiaUtil(dataRetorno);
            const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

            const dadosAtualizacao: any = {
              data_proxima_reposicao: proximaDataFormatada,
              status_agendamento: 'Previsto',
              substatus_pedido: 'Agendado'
            };

            if (pedido.tipo_pedido === 'Alterado') {
              dadosAtualizacao.tipo_pedido = 'Alterado';
              if (pedido.itens_personalizados) {
                dadosAtualizacao.itens_personalizados = pedido.itens_personalizados;
              }
            } else {
              dadosAtualizacao.tipo_pedido = 'Padrão';
            }

            await supabase
              .from('agendamentos_clientes')
              .update(dadosAtualizacao)
              .eq('id', pedido.id);
          }

          console.log(`✅ ${pedidosParaRetorno.length} retornos confirmados - NOVOS registros criados no histórico com datas previstas`);
          toast.success(`${pedidosParaRetorno.length} retornos registrados nas respectivas datas previstas e reagendados como Previsto`);
        } catch (error) {
          console.error('❌ Erro no retorno em massa:', error);
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
        const hoje = startOfDay(new Date());
        
        return get().pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaComparacao = startOfDay(dataEntrega);
          
          return p.status_agendamento === 'Agendado' &&
                 isBefore(dataEntregaComparacao, hoje) &&
                 p.substatus_pedido !== 'Entregue' && 
                 p.substatus_pedido !== 'Retorno';
        });
      }
    }),
    { name: 'expedicao-store' }
  )
);
