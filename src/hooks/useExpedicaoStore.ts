import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Cliente } from "@/types";
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
  tipo_pedido: 'agendado' | 'previsto';
  rota?: string;
  prioridade: 'baixa' | 'media' | 'alta';
  confirmado_producao?: boolean;
  data_expedicao?: Date;
  editado?: boolean;
  status_cliente?: string;
}

interface ExpedicaoStore {
  pedidos: PedidoExpedicao[];
  isLoading: boolean;
  semanaAtual: Date;
  pedidosSelecionados: Set<string>;
  
  carregarPedidos: () => Promise<void>;
  confirmarEntrega: (pedidoId: string) => Promise<boolean>;
  confirmarEntregaEmMassa: (pedidosIds: string[]) => Promise<void>;
  reagendarPedido: (pedidoId: string, novaData: Date, observacao?: string) => Promise<void>;
  cancelarPedido: (pedidoId: string, motivo?: string) => Promise<void>;
  marcarComoNaoEntregue: (pedidoId: string, motivo?: string) => Promise<void>;
  
  setSemanaAtual: (semana: Date) => void;
  togglePedidoSelecionado: (pedidoId: string) => void;
  selecionarTodosPedidos: () => void;
  limparSelecao: () => void;
  
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
        return get().pedidos.filter(p => p.tipo_pedido === 'agendado');
      },
      
      getPedidosPrevistos: () => {
        return get().pedidos.filter(p => p.tipo_pedido === 'previsto');
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
              clientes!inner(id, nome, ativo, status_cliente),
              produtos_agendamento(
                id,
                produto_id,
                quantidade,
                produtos_finais(id, nome)
              )
            `)
            .gte('data_entrega', inicioSemana.toISOString())
            .lte('data_entrega', fimSemana.toISOString())
            .eq('clientes.ativo', true)
            .in('status', ['Agendado', 'Previsto'])
            .order('data_entrega', { ascending: true });

          if (error) throw error;

          const pedidosConvertidos = agendamentos?.map(agendamento => ({
            id: agendamento.id,
            cliente_id: agendamento.cliente_id,
            cliente_nome: agendamento.clientes.nome,
            data_entrega: parseISO(agendamento.data_entrega),
            status: agendamento.status,
            substatus: agendamento.substatus || '',
            quantidade_total: agendamento.quantidade_total || 0,
            produtos: agendamento.produtos_agendamento?.map((pa: any) => ({
              produto_id: pa.produto_id,
              produto_nome: pa.produtos_finais?.nome || 'Produto não identificado',
              quantidade: pa.quantidade
            })) || [],
            observacao: agendamento.observacao,
            tipo_pedido: agendamento.status === 'Agendado' ? 'agendado' : 'previsto' as 'agendado' | 'previsto',
            rota: agendamento.rota_entrega,
            prioridade: 'media' as 'baixa' | 'media' | 'alta',
            confirmado_producao: agendamento.confirmado_producao,
            data_expedicao: agendamento.data_expedicao ? parseISO(agendamento.data_expedicao) : undefined,
            editado: agendamento.editado,
            status_cliente: agendamento.clientes.status_cliente
          })) || [];

          set({ pedidos: pedidosConvertidos });
          console.log(`✅ ${pedidosConvertidos.length} pedidos carregados para expedição`);
        } catch (error) {
          console.error('❌ Erro ao carregar pedidos:', error);
          toast.error('Erro ao carregar pedidos para expedição');
        } finally {
          set({ isLoading: false });
        }
      },
      
      confirmarEntrega: async (pedidoId: string): Promise<boolean> => {
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
              status: 'Entregue',
              data_entrega_efetiva: new Date().toISOString()
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
            status_anterior: pedido.status
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
      
      confirmarEntregaEmMassa: async (pedidosIds: string[]) => {
        console.log(`🚚 Iniciando confirmação em massa para ${pedidosIds.length} pedidos`);
        
        let sucessos = 0;
        let falhas = 0;
        
        for (const pedidoId of pedidosIds) {
          const sucesso = await get().confirmarEntrega(pedidoId);
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
              data_entrega: novaData.toISOString(),
              substatus: 'Reagendado',
              observacao: observacao || pedido.observacao,
              editado: true
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            status_anterior: pedido.status,
            observacao: `Reagendado para ${format(novaData, 'dd/MM/yyyy', { locale: ptBR })}${observacao ? ` - ${observacao}` : ''}`
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
              status: 'Cancelado',
              observacao: motivo || pedido.observacao,
              editado: true
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            status_anterior: pedido.status,
            observacao: `Pedido cancelado${motivo ? ` - ${motivo}` : ''}`
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
              substatus: 'Não entregue',
              observacao: motivo || pedido.observacao,
              editado: true
            })
            .eq('id', pedidoId);

          if (error) throw error;

          // Registrar no histórico
          const registroHistorico = {
            cliente_id: pedido.cliente_id,
            data: new Date(),
            tipo: 'retorno' as const,
            quantidade: pedido.quantidade_total,
            status_anterior: pedido.status,
            observacao: `Não entregue${motivo ? ` - ${motivo}` : ''}`
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
