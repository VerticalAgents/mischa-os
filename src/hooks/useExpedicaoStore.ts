
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, parseISO, isToday, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useHistoricoEntregasStore } from "./useHistoricoEntregasStore";
import { useExpedicaoStockValidation } from "./useExpedicaoStockValidation";

interface PedidoProduto {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
}

interface PedidoExpedicao {
  id: string;
  cliente_id: string;
  cliente_nome: string;
  data_entrega: Date;
  status: string;
  substatus: string;
  quantidade_total: number;
  produtos: PedidoProduto[];
  observacao?: string;
  tipo_pedido: 'Padrão' | 'Alterado';
  rota?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  confirmado_producao?: boolean;
  data_expedicao?: Date;
  editado?: boolean;
  status_cliente?: string;
  substatus_pedido?: string;
  cliente_endereco?: string;
}

interface ExpedicaoStore {
  pedidos: PedidoExpedicao[];
  isLoading: boolean;
  semanaAtual: Date;
  ultimaAtualizacao?: Date;
  pedidosSelecionados: Set<string>;
  
  // Carregamento
  carregarPedidos: () => Promise<void>;
  
  // Separação
  getPedidosParaSeparacao: () => PedidoExpedicao[];
  getPedidosProximoDia: () => PedidoExpedicao[];
  confirmarSeparacao: (pedidoId: string) => Promise<void>;
  marcarTodosSeparados: (pedidos: PedidoExpedicao[]) => Promise<void>;
  atualizarDataReferencia: () => Promise<void>;
  
  // Despacho
  getPedidosParaDespacho: () => PedidoExpedicao[];
  getPedidosAtrasados: () => PedidoExpedicao[];
  confirmarDespacho: (pedidoId: string) => Promise<void>;
  confirmarDespachoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  retornarParaSeparacao: (pedidoId: string) => Promise<void>;
  
  // Entrega
  confirmarEntrega: (pedidoId: string, observacao?: string) => Promise<boolean>;
  confirmarEntregaEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  confirmarRetorno: (pedidoId: string, observacao?: string) => Promise<void>;
  confirmarRetornoEmMassa: (pedidos: PedidoExpedicao[]) => Promise<void>;
  
  // Reagendamento
  reagendarPedido: (pedidoId: string, novaData: Date, observacao?: string) => Promise<void>;
  cancelarPedido: (pedidoId: string, motivo?: string) => Promise<void>;
  marcarComoNaoEntregue: (pedidoId: string, motivo?: string) => Promise<void>;
  
  // Seleção
  setSemanaAtual: (semana: Date) => void;
  togglePedidoSelecionado: (pedidoId: string) => void;
  selecionarTodosPedidos: () => void;
  limparSelecao: () => void;
  
  // Filtros legados
  getPedidosParaEntrega: () => PedidoExpedicao[];
  getPedidosReagendados: () => PedidoExpedicao[];
  getPedidosNaoEntregues: () => PedidoExpedicao[];
  getPedidosAgendados: () => PedidoExpedicao[];
  getPedidosPrevistos: () => PedidoExpedicao[];
}

export const useExpedicaoStore = create<ExpedicaoStore>()(
  devtools(
    (set, get) => ({
      pedidos: [],
      isLoading: false,
      semanaAtual: new Date(),
      ultimaAtualizacao: undefined,
      pedidosSelecionados: new Set(),
      
      setSemanaAtual: (semana: Date) => set({ semanaAtual: semana }),
      
      togglePedidoSelecionado: (pedidoId: string) => {
        set(state => {
          const nova = new Set(state.pedidosSelecionados);
          if (nova.has(pedidoId)) {
            nova.delete(pedidoId);
          } else {
            nova.add(pedidoId);
          }
          return { pedidosSelecionados: nova };
        });
      },
      
      selecionarTodosPedidos: () => {
        const pedidosParaEntrega = get().getPedidosParaEntrega();
        set({ pedidosSelecionados: new Set(pedidosParaEntrega.map(p => p.id)) });
      },
      
      limparSelecao: () => set({ pedidosSelecionados: new Set() }),
      
      // Filtros para separação
      getPedidosParaSeparacao: () => {
        const hoje = new Date();
        return get().pedidos.filter(p => 
          isToday(p.data_entrega) && 
          p.status === 'Agendado' && 
          p.substatus !== 'Separado'
        );
      },
      
      getPedidosProximoDia: () => {
        const amanha = addDays(new Date(), 1);
        return get().pedidos.filter(p => 
          format(p.data_entrega, 'yyyy-MM-dd') === format(amanha, 'yyyy-MM-dd') && 
          p.status === 'Agendado'
        );
      },
      
      // Filtros para despacho
      getPedidosParaDespacho: () => {
        return get().pedidos.filter(p => 
          isToday(p.data_entrega) && 
          (p.substatus === 'Separado' || p.substatus === 'Despachado') &&
          p.status === 'Agendado'
        );
      },
      
      getPedidosAtrasados: () => {
        const hoje = new Date();
        return get().pedidos.filter(p => 
          isBefore(p.data_entrega, hoje) && 
          p.status === 'Agendado' &&
          p.substatus !== 'Entregue'
        );
      },
      
      // Filtros legados
      getPedidosParaEntrega: () => {
        return get().pedidos.filter(p => 
          p.status === 'Agendado' && 
          p.substatus !== 'Reagendado' &&
          p.substatus !== 'Não entregue'
        );
      },
      
      getPedidosReagendados: () => {
        return get().pedidos.filter(p => p.substatus === 'Reagendado');
      },
      
      getPedidosNaoEntregues: () => {
        return get().pedidos.filter(p => p.substatus === 'Não entregue');
      },
      
      getPedidosAgendados: () => {
        return get().pedidos.filter(p => p.status === 'Agendado');
      },
      
      getPedidosPrevistos: () => {
        return get().pedidos.filter(p => p.status === 'Previsto');
      },
      
      carregarPedidos: async () => {
        set({ isLoading: true });
        try {
          const inicioSemana = startOfWeek(get().semanaAtual, { weekStartsOn: 1 });
          const fimSemana = endOfWeek(get().semanaAtual, { weekStartsOn: 1 });

          const { data: agendamentos, error } = await supabase
            .from('agendamentos_clientes')
            .select(`
              *,
              clientes!inner(id, nome, ativo, endereco_entrega)
            `)
            .gte('data_proxima_reposicao', inicioSemana.toISOString())
            .lte('data_proxima_reposicao', fimSemana.toISOString())
            .eq('clientes.ativo', true)
            .in('status_agendamento', ['Agendado', 'Previsto'])
            .order('data_proxima_reposicao', { ascending: true });

          if (error) throw error;

          const pedidosConvertidos = agendamentos?.map(agendamento => ({
            id: agendamento.id,
            cliente_id: agendamento.cliente_id,
            cliente_nome: agendamento.clientes?.nome || 'Cliente não identificado',
            cliente_endereco: agendamento.clientes?.endereco_entrega || '',
            data_entrega: parseISO(agendamento.data_proxima_reposicao),
            status: agendamento.status_agendamento,
            substatus: agendamento.substatus_pedido || '',
            substatus_pedido: agendamento.substatus_pedido || '',
            quantidade_total: agendamento.quantidade_total || 0,
            produtos: [], // Will be populated separately if needed
            tipo_pedido: (agendamento.substatus_pedido === 'Alterado' ? 'Alterado' : 'Padrão') as 'Padrão' | 'Alterado',
            prioridade: 'media' as 'baixa' | 'media' | 'alta',
            editado: false
          })) || [];

          set({ 
            pedidos: pedidosConvertidos,
            ultimaAtualizacao: new Date()
          });
          console.log(`✅ ${pedidosConvertidos.length} pedidos carregados para expedição`);
        } catch (error) {
          console.error('❌ Erro ao carregar pedidos:', error);
          toast.error('Erro ao carregar pedidos para expedição');
        } finally {
          set({ isLoading: false });
        }
      },
      
      confirmarSeparacao: async (pedidoId: string) => {
        try {
          console.log(`✅ Confirmando separação para pedido ${pedidoId}`);
          
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ 
              substatus_pedido: 'Separado'
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId 
                ? { ...p, substatus: 'Separado', substatus_pedido: 'Separado' }
                : p
            )
          }));

          toast.success('Pedido marcado como separado');
        } catch (error) {
          console.error('❌ Erro ao confirmar separação:', error);
          toast.error('Erro ao confirmar separação');
        }
      },
      
      marcarTodosSeparados: async (pedidos: PedidoExpedicao[]) => {
        try {
          console.log(`✅ Marcando ${pedidos.length} pedidos como separados`);
          
          const ids = pedidos.map(p => p.id);
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' })
            .in('id', ids);

          if (error) throw error;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              ids.includes(p.id)
                ? { ...p, substatus: 'Separado', substatus_pedido: 'Separado' }
                : p
            )
          }));

          toast.success(`${pedidos.length} pedidos marcados como separados`);
        } catch (error) {
          console.error('❌ Erro ao marcar pedidos como separados:', error);
          toast.error('Erro ao marcar pedidos como separados');
        }
      },

      confirmarDespacho: async (pedidoId: string) => {
        try {
          console.log(`🚚 Confirmando despacho para pedido ${pedidoId}`);
          
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ 
              substatus_pedido: 'Despachado'
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId 
                ? { ...p, substatus: 'Despachado', substatus_pedido: 'Despachado' }
                : p
            )
          }));

          toast.success('Pedido despachado');
        } catch (error) {
          console.error('❌ Erro ao confirmar despacho:', error);
          toast.error('Erro ao confirmar despacho');
        }
      },

      confirmarDespachoEmMassa: async (pedidos: PedidoExpedicao[]) => {
        try {
          console.log(`🚚 Despachando ${pedidos.length} pedidos em massa`);
          
          const ids = pedidos.map(p => p.id);
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' })
            .in('id', ids);

          if (error) throw error;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              ids.includes(p.id)
                ? { ...p, substatus: 'Despachado', substatus_pedido: 'Despachado' }
                : p
            )
          }));

          toast.success(`${pedidos.length} pedidos despachados`);
        } catch (error) {
          console.error('❌ Erro ao despachar pedidos em massa:', error);
          toast.error('Erro ao despachar pedidos');
        }
      },

      retornarParaSeparacao: async (pedidoId: string) => {
        try {
          console.log(`↩️ Retornando pedido ${pedidoId} para separação`);
          
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ 
              substatus_pedido: null
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId 
                ? { ...p, substatus: '', substatus_pedido: '' }
                : p
            )
          }));

          toast.success('Pedido retornado para separação');
        } catch (error) {
          console.error('❌ Erro ao retornar para separação:', error);
          toast.error('Erro ao retornar para separação');
        }
      },
      
      atualizarDataReferencia: async () => {
        await get().carregarPedidos();
        toast.success('Dados atualizados');
      },

      confirmarEntrega: async (pedidoId: string, observacao?: string): Promise<boolean> => {
        try {
          console.log(`🚚 Iniciando confirmação de entrega para pedido ${pedidoId}`);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) {
            console.error(`❌ Pedido ${pedidoId} não encontrado`);
            toast.error('Pedido não encontrado');
            return false;
          }

          // Validação de estoque usando o hook criado
          const { validarEstoqueParaEntrega, processarBaixaEstoque } = useExpedicaoStockValidation();
          
          const itens = pedido.produtos.map(p => ({
            produto_id: p.produto_id,
            produto_nome: p.produto_nome,
            quantidade: p.quantidade
          }));

          // Validar estoque antes de prosseguir
          const estoqueValido = await validarEstoqueParaEntrega(itens);
          if (!estoqueValido) {
            console.log('❌ Entrega bloqueada por estoque insuficiente');
            return false;
          }

          // Atualizar status no banco
          const { error: updateError } = await supabase
            .from('agendamentos_clientes')
            .update({ 
              status_agendamento: 'Entregue',
              substatus_pedido: 'Entregue',
              observacao: observacao
            })
            .eq('id', pedidoId);

          if (updateError) {
            console.error('❌ Erro ao atualizar status:', updateError);
            throw updateError;
          }

          // Adicionar registro ao histórico
          const historicoEntrega = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'entrega' as const,
            quantidade: pedido.quantidade_total,
            itens,
            status_anterior: pedido.status,
            observacao: observacao || '',
            editado_manualmente: false
          };

          const entregaId = await useHistoricoEntregasStore.getState().adicionarRegistro(historicoEntrega);
          
          if (entregaId) {
            // Processar baixa de estoque
            await processarBaixaEstoque(entregaId, itens);
          }

          // Remover da lista local
          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId)
          }));

          console.log(`✅ Entrega ${pedidoId} confirmada com sucesso`);
          toast.success(`Entrega confirmada para ${pedido.cliente_nome}`);
          return true;
        } catch (error) {
          console.error('❌ Erro ao confirmar entrega:', error);
          toast.error('Erro ao confirmar entrega');
          return false;
        }
      },
      
      confirmarEntregaEmMassa: async (pedidos: PedidoExpedicao[]) => {
        console.log(`🚚 Iniciando confirmação em massa para ${pedidos.length} pedidos`);
        
        let sucessos = 0;
        let falhas = 0;
        
        for (const pedido of pedidos) {
          const sucesso = await get().confirmarEntrega(pedido.id);
          if (sucesso) {
            sucessos++;
          } else {
            falhas++;
          }
        }
        
        if (sucessos > 0) {
          toast.success(`${sucessos} entrega${sucessos > 1 ? 's' : ''} confirmada${sucessos > 1 ? 's' : ''}`);
        }
        if (falhas > 0) {
          toast.error(`${falhas} entrega${falhas > 1 ? 's' : ''} falharam`);
        }
        
        // Limpar seleção
        set({ pedidosSelecionados: new Set() });
      },

      confirmarRetorno: async (pedidoId: string, observacao?: string) => {
        try {
          console.log(`↩️ Confirmando retorno para pedido ${pedidoId}`);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) {
            throw new Error('Pedido não encontrado');
          }

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({
              substatus_pedido: 'Não entregue',
              observacao: observacao || pedido.observacao
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            itens: [],
            status_anterior: pedido.status,
            observacao: `Não entregue${observacao ? ` - ${observacao}` : ''}`,
            editado_manualmente: false
          };

          await useHistoricoEntregasStore.getState().adicionarRegistro(registroHistorico);

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId 
                ? { ...p, substatus: 'Não entregue', substatus_pedido: 'Não entregue', observacao }
                : p
            )
          }));

          toast.success('Retorno confirmado');
        } catch (error) {
          console.error('❌ Erro ao confirmar retorno:', error);
          toast.error('Erro ao confirmar retorno');
        }
      },

      confirmarRetornoEmMassa: async (pedidos: PedidoExpedicao[]) => {
        console.log(`↩️ Iniciando retorno em massa para ${pedidos.length} pedidos`);
        
        for (const pedido of pedidos) {
          await get().confirmarRetorno(pedido.id, 'Retorno em massa');
        }
        
        toast.success(`${pedidos.length} pedidos marcados como não entregues`);
        
        // Limpar seleção
        set({ pedidosSelecionados: new Set() });
      },

      reagendarPedido: async (pedidoId: string, novaData: Date, observacao?: string) => {
        try {
          console.log(`📅 Reagendando pedido ${pedidoId} para ${format(novaData, 'dd/MM/yyyy')}`);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) {
            throw new Error('Pedido não encontrado');
          }

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({
              data_proxima_reposicao: novaData.toISOString(),
              substatus_pedido: 'Reagendado',
              observacao: observacao || pedido.observacao
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            itens: [],
            status_anterior: pedido.status,
            observacao: `Reagendado para ${format(novaData, 'dd/MM/yyyy', { locale: ptBR })}${observacao ? ` - ${observacao}` : ''}`,
            editado_manualmente: false
          };

          await useHistoricoEntregasStore.getState().adicionarRegistro(registroHistorico);

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId 
                ? { ...p, data_entrega: novaData, substatus: 'Reagendado', observacao, editado: true }
                : p
            )
          }));

          toast.success(`Pedido reagendado para ${format(novaData, 'dd/MM/yyyy')}`);
        } catch (error) {
          console.error('❌ Erro ao reagendar pedido:', error);
          toast.error('Erro ao reagendar pedido');
        }
      },

      cancelarPedido: async (pedidoId: string, motivo?: string) => {
        try {
          console.log(`❌ Cancelando pedido ${pedidoId}`);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) {
            throw new Error('Pedido não encontrado');
          }

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({
              status_agendamento: 'Cancelado',
              observacao: motivo || pedido.observacao
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            itens: [],
            status_anterior: pedido.status,
            observacao: `Pedido cancelado${motivo ? ` - ${motivo}` : ''}`,
            editado_manualmente: false
          };

          await useHistoricoEntregasStore.getState().adicionarRegistro(registroHistorico);

          // Remover da lista local
          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId)
          }));

          toast.success('Pedido cancelado');
        } catch (error) {
          console.error('❌ Erro ao cancelar pedido:', error);
          toast.error('Erro ao cancelar pedido');
        }
      },

      marcarComoNaoEntregue: async (pedidoId: string, motivo?: string) => {
        try {
          console.log(`🚫 Marcando pedido ${pedidoId} como não entregue`);
          
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          if (!pedido) {
            throw new Error('Pedido não encontrado');
          }

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({
              substatus_pedido: 'Não entregue',
              observacao: motivo || pedido.observacao
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            itens: [],
            status_anterior: pedido.status,
            observacao: `Não entregue${motivo ? ` - ${motivo}` : ''}`,
            editado_manualmente: false
          };

          await useHistoricoEntregasStore.getState().adicionarRegistro(registroHistorico);

          // Atualizar estado local
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId 
                ? { ...p, substatus: 'Não entregue', observacao: motivo, editado: true }
                : p
            )
          }));

          toast.success('Pedido marcado como não entregue');
        } catch (error) {
          console.error('❌ Erro ao marcar pedido como não entregue:', error);
          toast.error('Erro ao atualizar status do pedido');
        }
      }
    }),
    { name: 'expedicao-store' }
  )
);
