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
  cliente_razao_social?: string;
  cliente_endereco?: string;
  cliente_telefone?: string;
  link_google_maps?: string;
  representante_id?: number;
  gestaoclick_cliente_id?: string;
  data_prevista_entrega: Date;
  quantidade_total: number;
  tipo_pedido: string;
  status_agendamento: string;
  substatus_pedido?: SubstatusPedidoAgendado;
  itens_personalizados?: any;
  gestaoclick_venda_id?: string;
  gestaoclick_sincronizado_em?: string;
  created_at: Date;
  // Observações e trocas
  observacoes_gerais?: string;
  observacoes_agendamento?: string;
  trocas_pendentes?: any[];
  // Campos para lista de documentos
  emite_nota_fiscal?: boolean;
  forma_pagamento?: string;
}

interface ExpedicaoStore {
  pedidos: PedidoExpedicao[];
  isLoading: boolean;
  ultimaAtualizacao: Date | null;
  
  // Actions
  carregarPedidos: () => Promise<void>;
  recarregarSilencioso: () => Promise<void>;
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
  
  // Remoção imediata de pedido da lista (para atualização otimista)
  removerPedidoDaLista: (pedidoId: string) => void;
  
      // Getters estabilizados
      getPedidosParaSeparacao: () => PedidoExpedicao[];
      getPedidosParaDespacho: () => PedidoExpedicao[];
      getPedidosProximoDia: () => PedidoExpedicao[];
      getPedidosAtrasados: () => PedidoExpedicao[];
      getPedidosSeparadosAntecipados: () => PedidoExpedicao[];
      
      // Cache para evitar recalculos
      _cachePedidos: {
        separacao: PedidoExpedicao[];
        despacho: PedidoExpedicao[];
        proximoDia: PedidoExpedicao[];
        atrasados: PedidoExpedicao[];
        separadosAntecipados: PedidoExpedicao[];
        lastUpdate: number;
      };
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
      _cachePedidos: {
        separacao: [],
        despacho: [],
        proximoDia: [],
        atrasados: [],
        separadosAntecipados: [],
        lastUpdate: 0
      },

      // Remoção imediata de pedido da lista (atualização otimista)
      removerPedidoDaLista: (pedidoId: string) => {
        set(state => ({
          pedidos: state.pedidos.filter(p => p.id !== pedidoId),
          _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
        }));
      },
      
      atualizarDataReferencia: async () => {
        console.log('🔄 Atualizando data de referência para hoje...');
        await get().carregarPedidos();
        set({ ultimaAtualizacao: new Date() });
        toast.success("Data de referência atualizada com sucesso!");
      },
      
      carregarPedidos: async () => {
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

          // Tentar carregar dados dos clientes com gestaoclick_cliente_id
          let clientesData: any[] = [];
          
          try {
            const { data: clientesComLink, error: clientesError } = await supabase
              .from('clientes')
              .select('id, nome, endereco_entrega, contato_telefone, link_google_maps, representante_id, observacoes, gestaoclick_cliente_id, emite_nota_fiscal, forma_pagamento');

            if (clientesError) {
              console.warn('Erro ao carregar clientes:', clientesError);
              
              // Fallback: carregar sem gestaoclick_cliente_id
              const { data: clientesSemGC, error: fallbackError } = await supabase
                .from('clientes')
                .select('id, nome, endereco_entrega, contato_telefone, link_google_maps, representante_id, observacoes');

              if (fallbackError) {
                throw fallbackError;
              }

              clientesData = clientesSemGC || [];
            } else {
              clientesData = clientesComLink || [];
            }
          } catch (fallbackError) {
            console.error('Erro ao carregar dados dos clientes:', fallbackError);
            clientesData = [];
          }

          const clientesMap = new Map(clientesData.map(c => [c.id, c]));

          // Coletar IDs do GestaoClick para buscar razões sociais
          const gcClienteIds = clientesData
            .filter(c => c.gestaoclick_cliente_id)
            .map(c => c.gestaoclick_cliente_id);

          // Buscar razões sociais em lote se houver IDs do GC
          let razoesSociaisMap: Record<string, string> = {};
          if (gcClienteIds.length > 0) {
            try {
              // Buscar configuração do GestaoClick
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.user?.id) {
                const { data: configData } = await supabase
                  .from('integracoes_config')
                  .select('config')
                  .eq('user_id', sessionData.session.user.id)
                  .eq('integracao', 'gestaoclick')
                  .maybeSingle();

                if (configData?.config) {
                  const config = configData.config as any;
                  if (config.access_token && config.secret_token) {
                    const { data: razaoData } = await supabase.functions.invoke('gestaoclick-proxy', {
                      body: {
                        action: 'buscar_razoes_sociais_lote',
                        gestaoclick_cliente_ids: gcClienteIds,
                        access_token: config.access_token,
                        secret_token: config.secret_token
                      }
                    });
                    
                    if (razaoData?.razoes_sociais) {
                      razoesSociaisMap = razaoData.razoes_sociais;
                      console.log('📋 Razões sociais carregadas:', Object.keys(razoesSociaisMap).length);
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('Erro ao buscar razões sociais:', err);
            }
          }

          const pedidosFormatados = (agendamentos || []).map(agendamento => {
            const cliente = clientesMap.get(agendamento.cliente_id);
            const gcId = cliente?.gestaoclick_cliente_id;
            
            let dataPrevisao = new Date();
            if (agendamento.data_proxima_reposicao) {
              dataPrevisao = parseDataSegura(agendamento.data_proxima_reposicao);
            }
            
            return {
              id: agendamento.id,
              cliente_id: agendamento.cliente_id,
              cliente_nome: cliente?.nome || 'Cliente não encontrado',
              cliente_razao_social: gcId && razoesSociaisMap[gcId] ? razoesSociaisMap[gcId] : undefined,
              cliente_endereco: cliente?.endereco_entrega,
              cliente_telefone: cliente?.contato_telefone,
              link_google_maps: cliente?.link_google_maps,
              representante_id: cliente?.representante_id,
              gestaoclick_cliente_id: gcId || undefined,
              data_prevista_entrega: dataPrevisao,
              quantidade_total: agendamento.quantidade_total || 0,
              tipo_pedido: agendamento.tipo_pedido || 'Padrão',
              status_agendamento: agendamento.status_agendamento,
              substatus_pedido: (agendamento.substatus_pedido || 'Agendado') as SubstatusPedidoAgendado,
              itens_personalizados: agendamento.itens_personalizados,
              gestaoclick_venda_id: agendamento.gestaoclick_venda_id || undefined,
              gestaoclick_sincronizado_em: agendamento.gestaoclick_sincronizado_em || undefined,
              created_at: agendamento.created_at ? new Date(agendamento.created_at) : new Date(),
              // Observações e trocas
              observacoes_gerais: cliente?.observacoes || undefined,
              observacoes_agendamento: agendamento.observacoes_agendamento || undefined,
              trocas_pendentes: Array.isArray(agendamento.trocas_pendentes) ? agendamento.trocas_pendentes : [],
              // Campos para lista de documentos
              emite_nota_fiscal: cliente?.emite_nota_fiscal ?? true,
              forma_pagamento: cliente?.forma_pagamento || 'PIX'
            };
          });

          console.log('✅ Pedidos formatados para expedição:', pedidosFormatados.length);
          set({ 
            pedidos: pedidosFormatados,
            ultimaAtualizacao: new Date(),
            _cachePedidos: {
              separacao: [],
              despacho: [],
              proximoDia: [],
              atrasados: [],
              separadosAntecipados: [],
              lastUpdate: 0
            }
          });
          
        } catch (error) {
          console.error('Erro ao carregar pedidos:', error);
          toast.error("Erro ao carregar pedidos");
        } finally {
          set({ isLoading: false });
        }
      },

      // Recarregar dados sem mostrar indicador de loading (para atualizações em background)
      recarregarSilencioso: async () => {
        try {
          console.log('🔄 Recarregando dados silenciosamente...');
          
          const { data: agendamentos, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('status_agendamento', 'Agendado');

          if (error) {
            console.error('Erro ao recarregar agendamentos:', error);
            return;
          }

          let clientesData: any[] = [];
          
          try {
            const { data: clientesComLink, error: clientesError } = await supabase
              .from('clientes')
              .select('id, nome, endereco_entrega, contato_telefone, link_google_maps, representante_id, observacoes, gestaoclick_cliente_id, emite_nota_fiscal, forma_pagamento');

            if (clientesError) {
              const { data: clientesSemLink, error: fallbackError } = await supabase
                .from('clientes')
                .select('id, nome, endereco_entrega, contato_telefone, representante_id, observacoes');

              if (fallbackError) {
                throw fallbackError;
              }

              clientesData = clientesSemLink || [];
            } else {
              clientesData = clientesComLink || [];
            }
          } catch (fallbackError) {
            console.warn('Erro ao carregar dados dos clientes:', fallbackError);
          }

          const clientesMap = new Map(clientesData.map(c => [c.id, c]));

          // Buscar razões sociais em lote
          const gcClienteIds = clientesData
            .filter(c => c.gestaoclick_cliente_id)
            .map(c => c.gestaoclick_cliente_id);

          let razoesSociaisMap: Record<string, string> = {};
          if (gcClienteIds.length > 0) {
            try {
              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session?.user?.id) {
                const { data: configData } = await supabase
                  .from('integracoes_config')
                  .select('config')
                  .eq('user_id', sessionData.session.user.id)
                  .eq('integracao', 'gestaoclick')
                  .maybeSingle();

                if (configData?.config) {
                  const config = configData.config as any;
                  if (config.access_token && config.secret_token) {
                    const { data: razaoData } = await supabase.functions.invoke('gestaoclick-proxy', {
                      body: {
                        action: 'buscar_razoes_sociais_lote',
                        gestaoclick_cliente_ids: gcClienteIds,
                        access_token: config.access_token,
                        secret_token: config.secret_token
                      }
                    });
                    
                    if (razaoData?.razoes_sociais) {
                      razoesSociaisMap = razaoData.razoes_sociais;
                    }
                  }
                }
              }
            } catch (err) {
              console.warn('Erro ao buscar razões sociais:', err);
            }
          }

          const pedidosFormatados: PedidoExpedicao[] = (agendamentos || []).map(agendamento => {
            const cliente = clientesMap.get(agendamento.cliente_id);
            const gcId = cliente?.gestaoclick_cliente_id;
            
            return {
              id: agendamento.id,
              cliente_id: agendamento.cliente_id,
              cliente_nome: cliente?.nome || 'Cliente não encontrado',
              cliente_razao_social: gcId && razoesSociaisMap[gcId] ? razoesSociaisMap[gcId] : undefined,
              cliente_endereco: cliente?.endereco_entrega,
              cliente_telefone: cliente?.contato_telefone,
              link_google_maps: cliente?.link_google_maps,
              representante_id: cliente?.representante_id,
              gestaoclick_cliente_id: gcId || undefined,
              data_prevista_entrega: parseDataSegura(agendamento.data_proxima_reposicao || new Date()),
              quantidade_total: agendamento.quantidade_total,
              tipo_pedido: agendamento.tipo_pedido,
              status_agendamento: agendamento.status_agendamento,
              substatus_pedido: agendamento.substatus_pedido as SubstatusPedidoAgendado,
              itens_personalizados: agendamento.itens_personalizados,
              gestaoclick_venda_id: agendamento.gestaoclick_venda_id || undefined,
              gestaoclick_sincronizado_em: agendamento.gestaoclick_sincronizado_em || undefined,
              created_at: new Date(agendamento.created_at),
              // Observações e trocas
              observacoes_gerais: cliente?.observacoes || undefined,
              observacoes_agendamento: agendamento.observacoes_agendamento || undefined,
              trocas_pendentes: Array.isArray(agendamento.trocas_pendentes) ? agendamento.trocas_pendentes : [],
              // Campos para lista de documentos
              emite_nota_fiscal: cliente?.emite_nota_fiscal ?? true,
              forma_pagamento: cliente?.forma_pagamento || 'PIX'
            };
          });

          // Invalidar cache e atualizar pedidos
          set({ 
            pedidos: pedidosFormatados, 
            ultimaAtualizacao: new Date(),
            _cachePedidos: {
              separacao: [],
              despacho: [],
              proximoDia: [],
              atrasados: [],
              separadosAntecipados: [],
              lastUpdate: 0
            }
          });
          console.log('✅ Dados recarregados silenciosamente');
        } catch (error) {
          console.error('❌ Erro ao recarregar dados:', error);
        }
      },

      confirmarSeparacao: async (pedidoId: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } : p
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Separado' })
            .eq('id', pedidoId);

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' as SubstatusPedidoAgendado } : p
              ),
              _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
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
              p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' as SubstatusPedidoAgendado } : p
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Agendado' })
            .eq('id', pedidoId);

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } : p
              ),
              _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
            }));
            throw error;
          }

          toast.success(`Separação desfeita para ${pedido?.cliente_nome}`);
        } catch (error) {
          console.error('Erro ao desfazer separação:', error);
          toast.error("Erro ao desfazer separação");
        }
      },

      retornarParaSeparacao: async (pedidoId: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          // Atualiza o estado local primeiro
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Agendado' as SubstatusPedidoAgendado } : p
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          // Atualiza no banco de dados
          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Agendado' })
            .eq('id', pedidoId);

          if (error) {
            // Reverte se houver erro
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Despachado' as SubstatusPedidoAgendado } : p
              ),
              _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
            }));
            throw error;
          }

          toast.success(`${pedido?.cliente_nome} retornado para separação`);
        } catch (error) {
          console.error('Erro ao retornar para separação:', error);
          toast.error("Erro ao retornar pedido para separação");
        }
      },

      confirmarDespacho: async (pedidoId: string) => {
        try {
          const pedido = get().pedidos.find(p => p.id === pedidoId);
          
          set(state => ({
            pedidos: state.pedidos.map(p => 
              p.id === pedidoId ? { ...p, substatus_pedido: 'Despachado' as SubstatusPedidoAgendado } : p
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          const { error } = await supabase
            .from('agendamentos_clientes')
            .update({ substatus_pedido: 'Despachado' })
            .eq('id', pedidoId);

          if (error) {
            set(state => ({
              pedidos: state.pedidos.map(p => 
                p.id === pedidoId ? { ...p, substatus_pedido: 'Separado' as SubstatusPedidoAgendado } : p
              ),
              _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
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

          // Verificar se o pedido foi despachado
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

          // NOVA VALIDAÇÃO: Usar o hook de confirmação de entrega
          const { confirmarEntrega } = useConfirmacaoEntrega();
          const entregaConfirmada = await confirmarEntrega(pedido, observacao);
          
          if (!entregaConfirmada) {
            console.log('❌ Entrega não foi confirmada devido a problemas de estoque');
            return;
          }

          // O RPC process_entrega_safe já cria o registro no histórico, então só precisamos recarregar
          console.log('✅ Entrega processada - o histórico foi criado pelo backend');

          // Remover do estado local da expedição
          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          // Carregar dados do cliente para periodicidade
          const { data: cliente } = await supabase
            .from('clientes')
            .select('periodicidade_padrao')
            .eq('id', pedido.cliente_id)
            .single();

          // CORREÇÃO: Calcular próxima data baseada na data prevista original, não na data atual
          const dataEntrega = pedido.data_prevista_entrega;
          const proximaData = addDays(dataEntrega, cliente?.periodicidade_padrao || 7);
          const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

          // CORREÇÃO: Status deve ser "Previsto" e preservar tipo de pedido e itens personalizados
          const dadosAtualizacao: any = {
            data_proxima_reposicao: proximaDataFormatada,
            status_agendamento: 'Previsto',
            substatus_pedido: 'Agendado'
          };

          // PRESERVAR tipo de pedido e itens personalizados no reagendamento
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

          // Recarregar histórico para obter o registro criado pelo backend
          const historicoStore = useHistoricoEntregasStore.getState();
          await historicoStore.carregarHistorico();

          console.log('✅ Entrega confirmada com baixa no estoque - registro criado pelo backend');
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

          // Verificar se o pedido foi despachado
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

          // CRÍTICO: Gravar no histórico ANTES de alterar o agendamento
          const historicoStore = useHistoricoEntregasStore.getState();
          
          // CORREÇÃO: Usar a data prevista de entrega do pedido como data do retorno
          const dataRetorno = pedido.data_prevista_entrega;
          
          console.log('📝 Criando NOVO registro de retorno no histórico com data prevista:', dataRetorno);
          await historicoStore.adicionarRegistro({
            cliente_id: pedido.cliente_id,
            data: dataRetorno, // Usar data prevista do pedido, não data atual
            tipo: 'retorno',
            quantidade: pedido.quantidade_total,
            itens: pedido.itens_personalizados || [],
            status_anterior: pedido.substatus_pedido || 'Agendado',
            observacao: observacao || undefined
          });

          // Remover do estado local da expedição
          set(state => ({
            pedidos: state.pedidos.filter(p => p.id !== pedidoId),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          // Reagendar para próximo dia útil baseado na data prevista original
          const proximaData = getProximoDiaUtil(dataRetorno);
          const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

          // CORREÇÃO: Status deve ser "Previsto" e preservar tipo de pedido
          const dadosAtualizacao: any = {
            data_proxima_reposicao: proximaDataFormatada,
            status_agendamento: 'Previsto',
            substatus_pedido: 'Agendado'
          };

          // PRESERVAR tipo de pedido e itens personalizados no reagendamento
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
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
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
              ),
              _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
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
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
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
              ),
              _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
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
          
          // NOVA VALIDAÇÃO: Usar o hook de confirmação de entrega
          const { confirmarEntregaEmMassa } = useConfirmacaoEntrega();
          const entregasConfirmadas = await confirmarEntregaEmMassa(pedidosParaEntregar);
          
          if (!entregasConfirmadas) {
            console.log('❌ Entregas em massa não foram confirmadas devido a problemas de estoque');
            return;
          }

          // O RPC process_entrega_safe já cria os registros no histórico para cada pedido
          console.log('✅ Entregas processadas - históricos criados pelo backend');
          
          set(state => ({
            pedidos: state.pedidos.filter(p => 
              !pedidosParaEntregar.some(pe => pe.id === p.id)
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          for (const pedido of pedidosParaEntregar) {
            const dataEntrega = pedido.data_prevista_entrega;

            const { data: cliente } = await supabase
              .from('clientes')
              .select('periodicidade_padrao')
              .eq('id', pedido.cliente_id)
              .single();

            // CORREÇÃO: Calcular próxima data baseada na data prevista original
            const proximaData = addDays(dataEntrega, cliente?.periodicidade_padrao || 7);
            const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

            // CORREÇÃO: Status deve ser "Previsto" e preservar tipo de pedido
            const dadosAtualizacao: any = {
              data_proxima_reposicao: proximaDataFormatada,
              status_agendamento: 'Previsto',
              substatus_pedido: 'Agendado'
            };

            // PRESERVAR tipo de pedido e itens personalizados
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

          // Recarregar histórico para obter os registros criados pelo backend
          const historicoStore = useHistoricoEntregasStore.getState();
          await historicoStore.carregarHistorico();

          console.log(`✅ ${pedidosParaEntregar.length} entregas confirmadas com baixa automática no estoque - registros criados pelo backend`);
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

          // Gravar histórico para todos os pedidos - CADA UM UM NOVO REGISTRO
          const historicoStore = useHistoricoEntregasStore.getState();

          set(state => ({
            pedidos: state.pedidos.filter(p => 
              !pedidosParaRetorno.some(pr => pr.id === p.id)
            ),
            _cachePedidos: { ...state._cachePedidos, lastUpdate: 0 }
          }));

          for (const pedido of pedidosParaRetorno) {
            console.log(`📝 Criando registro de retorno para ${pedido.cliente_nome}...`);
            
            // CORREÇÃO: Usar a data prevista de entrega do pedido
            const dataRetorno = pedido.data_prevista_entrega;
            
            // Gravar no histórico - NOVO registro para cada pedido
            await historicoStore.adicionarRegistro({
              cliente_id: pedido.cliente_id,
              data: dataRetorno, // Usar data prevista do pedido, não data atual
              tipo: 'retorno',
              quantidade: pedido.quantidade_total,
              itens: pedido.itens_personalizados || [],
              status_anterior: pedido.substatus_pedido || 'Agendado'
            });

            // Reagendar para próximo dia útil baseado na data prevista original
            const proximaData = getProximoDiaUtil(dataRetorno);
            const proximaDataFormatada = format(proximaData, 'yyyy-MM-dd');

            // CORREÇÃO: Status deve ser "Previsto" e preservar tipo de pedido
            const dadosAtualizacao: any = {
              data_proxima_reposicao: proximaDataFormatada,
              status_agendamento: 'Previsto',
              substatus_pedido: 'Agendado'
            };

            // PRESERVAR tipo de pedido e itens personalizados
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
        const state = get();
        const now = Date.now();
        
        // Cache por 30 segundos para evitar recálculos desnecessários
        if (now - state._cachePedidos.lastUpdate < 30000 && state._cachePedidos.separacao.length >= 0) {
          return state._cachePedidos.separacao;
        }
        
        const hoje = new Date();
        const hojeFormatado = format(hoje, 'yyyy-MM-dd');
        
        const resultado = state.pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' && 
                 (!p.substatus_pedido || p.substatus_pedido === 'Agendado') &&
                 dataEntregaFormatada === hojeFormatado;
        });
        
        // Atualizar cache
        set(prevState => ({
          _cachePedidos: {
            ...prevState._cachePedidos,
            separacao: resultado,
            lastUpdate: now
          }
        }));
        
        return resultado;
      },

      getPedidosParaDespacho: () => {
        const state = get();
        const now = Date.now();
        
        // Cache por 30 segundos
        if (now - state._cachePedidos.lastUpdate < 30000 && state._cachePedidos.despacho.length >= 0) {
          return state._cachePedidos.despacho;
        }
        
        const hoje = new Date();
        const hojeFormatado = format(hoje, 'yyyy-MM-dd');
        
        const resultado = state.pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' &&
                 (p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado') &&
                 dataEntregaFormatada === hojeFormatado;
        });
        
        // Atualizar cache
        set(prevState => ({
          _cachePedidos: {
            ...prevState._cachePedidos,
            despacho: resultado,
            lastUpdate: now
          }
        }));
        
        return resultado;
      },

      getPedidosProximoDia: () => {
        const state = get();
        const now = Date.now();
        
        if (now - state._cachePedidos.lastUpdate < 30000 && state._cachePedidos.proximoDia.length >= 0) {
          return state._cachePedidos.proximoDia;
        }
        
        const hoje = new Date();
        const proximoDiaUtil = getProximoDiaUtil(hoje);
        const proximoDiaStr = format(proximoDiaUtil, 'yyyy-MM-dd');
        
        const resultado = state.pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaFormatada = format(dataEntrega, 'yyyy-MM-dd');
          
          return p.status_agendamento === 'Agendado' &&
                 dataEntregaFormatada === proximoDiaStr;
        });
        
        set(prevState => ({
          _cachePedidos: {
            ...prevState._cachePedidos,
            proximoDia: resultado,
            lastUpdate: now
          }
        }));
        
        return resultado;
      },

      getPedidosAtrasados: () => {
        const state = get();
        const now = Date.now();
        
        if (now - state._cachePedidos.lastUpdate < 30000 && state._cachePedidos.atrasados.length >= 0) {
          return state._cachePedidos.atrasados;
        }
        
        const hoje = startOfDay(new Date());
        
        // CORREÇÃO: Mostrar apenas pedidos Separado/Despachado atrasados
        // Pedidos "Agendado" (não separados) ficam SOMENTE na aba Separação
        const resultado = state.pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaComparacao = startOfDay(dataEntrega);
          
          return p.status_agendamento === 'Agendado' &&
                 isBefore(dataEntregaComparacao, hoje) &&
                 (p.substatus_pedido === 'Separado' || p.substatus_pedido === 'Despachado');
        });
        
        set(prevState => ({
          _cachePedidos: {
            ...prevState._cachePedidos,
            atrasados: resultado,
            lastUpdate: now
          }
        }));
        
        return resultado;
      },

      getPedidosSeparadosAntecipados: () => {
        const state = get();
        const now = Date.now();
        
        if (now - state._cachePedidos.lastUpdate < 30000 && state._cachePedidos.separadosAntecipados.length >= 0) {
          return state._cachePedidos.separadosAntecipados;
        }
        
        const hoje = startOfDay(new Date());
        
        const resultado = state.pedidos.filter(p => {
          const dataEntrega = parseDataSegura(p.data_prevista_entrega);
          const dataEntregaComparacao = startOfDay(dataEntrega);
          
          return p.status_agendamento === 'Agendado' &&
                 p.substatus_pedido === 'Separado' &&
                 dataEntregaComparacao > hoje;
        });
        
        set(prevState => ({
          _cachePedidos: {
            ...prevState._cachePedidos,
            separadosAntecipados: resultado,
            lastUpdate: now
          }
        }));
        
        return resultado;
      }
    }),
    { name: 'expedicao-store' }
  )
);
