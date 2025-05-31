
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgendamentoItem } from '@/components/agendamento/types';

export interface AgendamentoCliente {
  id?: string;
  cliente_id: string;
  tipo_pedido: 'Padrão' | 'Alterado';
  status_agendamento: 'Agendar' | 'Previsto' | 'Agendado';
  data_proxima_reposicao?: Date;
  quantidade_total: number;
  itens_personalizados?: { produto: string; quantidade: number }[];
  substatus_pedido?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface AgendamentoClienteStore {
  agendamentos: AgendamentoItem[]; // Changed to AgendamentoItem for the list view
  loading: boolean;
  error: string | null;
  
  // Actions
  carregarTodosAgendamentos: () => Promise<void>;
  carregarAgendamentoPorCliente: (clienteId: string) => Promise<AgendamentoCliente | null>;
  obterAgendamento: (clienteId: string) => Promise<AgendamentoCliente | null>;
  salvarAgendamento: (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => Promise<void>;
  criarAgendamentoSeNaoExiste: (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => Promise<void>;
  limparErro: () => void;
}

// Helper function to convert database row to AgendamentoCliente
const convertDbRowToAgendamento = (row: any): AgendamentoCliente => {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    tipo_pedido: row.tipo_pedido as 'Padrão' | 'Alterado',
    status_agendamento: row.status_agendamento as 'Agendar' | 'Previsto' | 'Agendado',
    data_proxima_reposicao: row.data_proxima_reposicao ? new Date(row.data_proxima_reposicao) : undefined,
    quantidade_total: row.quantidade_total,
    itens_personalizados: row.itens_personalizados as { produto: string; quantidade: number }[] | undefined,
    substatus_pedido: row.substatus_pedido,
    created_at: row.created_at ? new Date(row.created_at) : undefined,
    updated_at: row.updated_at ? new Date(row.updated_at) : undefined,
  };
};

// Helper function to convert AgendamentoCliente to AgendamentoItem format
const convertToAgendamentoItem = (agendamento: any, cliente: any): AgendamentoItem => {
  return {
    cliente: {
      id: cliente.id,
      nome: cliente.nome,
      cnpjCpf: cliente.cnpj_cpf,
      enderecoEntrega: cliente.endereco_entrega,
      contatoNome: cliente.contato_nome,
      contatoTelefone: cliente.contato_telefone,
      contatoEmail: cliente.contato_email,
      quantidadePadrao: cliente.quantidade_padrao || 0,
      periodicidadePadrao: cliente.periodicidade_padrao || 7,
      statusCliente: cliente.status_cliente || 'Ativo',
      dataCadastro: new Date(cliente.created_at),
      metaGiroSemanal: cliente.meta_giro_semanal,
      ultimaDataReposicaoEfetiva: cliente.ultima_data_reposicao_efetiva ? new Date(cliente.ultima_data_reposicao_efetiva) : undefined,
      statusAgendamento: agendamento.status_agendamento,
      proximaDataReposicao: agendamento.data_proxima_reposicao ? new Date(agendamento.data_proxima_reposicao) : undefined,
      ativo: cliente.ativo !== false,
      giroMedioSemanal: cliente.giro_medio_semanal,
      janelasEntrega: cliente.janelas_entrega,
      representanteId: cliente.representante_id,
      rotaEntregaId: cliente.rota_entrega_id,
      categoriaEstabelecimentoId: cliente.categoria_estabelecimento_id,
      instrucoesEntrega: cliente.instrucoes_entrega,
      contabilizarGiroMedio: cliente.contabilizar_giro_medio !== false,
      tipoLogistica: cliente.tipo_logistica || 'Própria',
      emiteNotaFiscal: cliente.emite_nota_fiscal !== false,
      tipoCobranca: cliente.tipo_cobranca || 'À vista',
      formaPagamento: cliente.forma_pagamento || 'Boleto',
      observacoes: cliente.observacoes,
      categoriaId: cliente.categoria_id || 1,
      subcategoriaId: cliente.subcategoria_id || 1,
      categoriasHabilitadas: cliente.categorias_habilitadas
    },
    dataReposicao: agendamento.data_proxima_reposicao ? new Date(agendamento.data_proxima_reposicao) : new Date(),
    statusAgendamento: agendamento.status_agendamento,
    isPedidoUnico: false,
    pedido: agendamento.tipo_pedido === 'Alterado' ? {
      id: 0,
      idCliente: cliente.id,
      dataPedido: new Date(),
      dataPrevistaEntrega: agendamento.data_proxima_reposicao ? new Date(agendamento.data_proxima_reposicao) : new Date(),
      statusPedido: 'Agendado',
      itensPedido: [],
      totalPedidoUnidades: agendamento.quantidade_total,
      tipoPedido: agendamento.tipo_pedido
    } : undefined
  };
};

// Helper function to convert AgendamentoCliente to database format
const convertAgendamentoToDbFormat = (agendamento: Partial<AgendamentoCliente>) => {
  const dbData: any = {};
  
  if (agendamento.cliente_id) dbData.cliente_id = agendamento.cliente_id;
  if (agendamento.tipo_pedido) dbData.tipo_pedido = agendamento.tipo_pedido;
  if (agendamento.status_agendamento) dbData.status_agendamento = agendamento.status_agendamento;
  if (agendamento.data_proxima_reposicao) dbData.data_proxima_reposicao = agendamento.data_proxima_reposicao.toISOString().split('T')[0];
  if (agendamento.quantidade_total !== undefined) dbData.quantidade_total = agendamento.quantidade_total;
  if (agendamento.itens_personalizados !== undefined) dbData.itens_personalizados = agendamento.itens_personalizados;
  if (agendamento.substatus_pedido) dbData.substatus_pedido = agendamento.substatus_pedido;
  if (agendamento.created_at) dbData.created_at = agendamento.created_at.toISOString();
  if (agendamento.updated_at) dbData.updated_at = agendamento.updated_at.toISOString();
  
  return dbData;
};

export const useAgendamentoClienteStore = create<AgendamentoClienteStore>()(
  devtools(
    (set, get) => ({
      agendamentos: [],
      loading: false,
      error: null,

      carregarTodosAgendamentos: async () => {
        set({ loading: true, error: null });
        try {
          console.log('useAgendamentoClienteStore: Carregando todos os agendamentos...');
          
          // Join with clientes table to get client information
          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select(`
              *,
              clientes (*)
            `);

          if (error) {
            console.error('useAgendamentoClienteStore: Erro ao carregar agendamentos:', error);
            throw error;
          }

          const agendamentosConvertidos = data?.map(row => 
            convertToAgendamentoItem(row, row.clientes)
          ) || [];
          
          console.log('useAgendamentoClienteStore: Agendamentos carregados:', agendamentosConvertidos.length);
          set({ agendamentos: agendamentosConvertidos, loading: false });
        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido', loading: false });
        }
      },

      carregarAgendamentoPorCliente: async (clienteId: string) => {
        try {
          console.log('useAgendamentoClienteStore: Carregando agendamento para cliente:', clienteId);
          
          const { data, error } = await supabase
            .from('agendamentos_clientes')
            .select('*')
            .eq('cliente_id', clienteId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('useAgendamentoClienteStore: Erro ao carregar agendamento:', error);
            throw error;
          }

          const agendamento = data ? convertDbRowToAgendamento(data) : null;
          console.log('useAgendamentoClienteStore: Agendamento carregado:', agendamento);
          
          // Log específico para depuração de itens personalizados
          if (agendamento && agendamento.tipo_pedido === 'Alterado') {
            console.log('🔍 Agendamento Alterado carregado:', {
              tipo: agendamento.tipo_pedido,
              itens_personalizados: agendamento.itens_personalizados,
              quantidade_total: agendamento.quantidade_total
            });
          }
          
          return agendamento;
        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro ao carregar agendamento:', error);
          return null;
        }
      },

      obterAgendamento: async (clienteId: string) => {
        return get().carregarAgendamentoPorCliente(clienteId);
      },

      salvarAgendamento: async (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => {
        try {
          console.log('useAgendamentoClienteStore: Salvando agendamento para cliente:', clienteId, dadosAgendamento);
          
          // Verificar se o agendamento já existe
          const agendamentoExistente = await get().obterAgendamento(clienteId);
          
          const dadosParaSalvar = {
            cliente_id: clienteId,
            ...convertAgendamentoToDbFormat(dadosAgendamento),
            updated_at: new Date().toISOString()
          };

          let result;
          if (agendamentoExistente) {
            // PRESERVAR dados existentes quando não especificado explicitamente
            const dadosAtualizacao = {
              ...dadosParaSalvar,
              // Preservar tipo de pedido se não especificado
              tipo_pedido: dadosAgendamento.tipo_pedido !== undefined 
                ? dadosAgendamento.tipo_pedido 
                : agendamentoExistente.tipo_pedido,
              // Preservar itens personalizados se não especificado e tipo for Alterado
              itens_personalizados: dadosAgendamento.itens_personalizados !== undefined 
                ? dadosAgendamento.itens_personalizados 
                : (dadosAgendamento.tipo_pedido === 'Alterado' || agendamentoExistente.tipo_pedido === 'Alterado')
                  ? agendamentoExistente.itens_personalizados 
                  : null
            };
            
            console.log('🔄 Atualizando agendamento existente:', {
              id: agendamentoExistente.id,
              tipoAnterior: agendamentoExistente.tipo_pedido,
              tipoNovo: dadosAtualizacao.tipo_pedido,
              itensPersonalizados: dadosAtualizacao.itens_personalizados
            });
            
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .update(dadosAtualizacao)
              .eq('cliente_id', clienteId)
              .select()
              .single();
            
            result = { data, error };
          } else {
            // Criar novo agendamento
            console.log('➕ Criando novo agendamento:', dadosParaSalvar);
            
            const { data, error } = await supabase
              .from('agendamentos_clientes')
              .insert({
                ...dadosParaSalvar,
                created_at: new Date().toISOString()
              })
              .select()
              .single();
            
            result = { data, error };
          }

          if (result.error) {
            console.error('useAgendamentoClienteStore: Erro ao salvar agendamento:', result.error);
            throw result.error;
          }

          console.log('✅ Agendamento salvo com sucesso:', result.data);
          
          // Recarregar todos os agendamentos para atualizar a lista
          await get().carregarTodosAgendamentos();

        } catch (error) {
          console.error('useAgendamentoClienteStore: Erro ao salvar agendamento:', error);
          toast.error('Erro ao salvar agendamento');
          throw error;
        }
      },

      criarAgendamentoSeNaoExiste: async (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => {
        const agendamentoExistente = await get().obterAgendamento(clienteId);
        
        if (!agendamentoExistente) {
          await get().salvarAgendamento(clienteId, dadosIniciais);
        }
      },

      limparErro: () => set({ error: null })
    }),
    { name: 'agendamento-cliente-store' }
  )
);
