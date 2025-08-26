import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AgendamentoCliente } from './types';
import { 
  convertDbRowToAgendamento, 
  convertToAgendamentoItem, 
  convertAgendamentoToDbFormat 
} from './utils';

export const createAgendamentoActions = (
  get: () => any,
  set: (fn: (state: any) => any) => void
) => ({
  carregarTodosAgendamentos: async () => {
    set((state: any) => ({ ...state, loading: true, error: null }));
    try {
      console.log('useAgendamentoClienteStore: Carregando todos os agendamentos otimizado...');
      
      // Carregar todos os agendamentos com clientes em uma única query
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

      // Armazenar agendamentos completos no cache
      const agendamentosCompletosMapa = new Map();
      data?.forEach(row => {
        agendamentosCompletosMapa.set(row.cliente_id, convertDbRowToAgendamento(row));
      });
      
      console.log('useAgendamentoClienteStore: Agendamentos carregados:', agendamentosConvertidos.length);
      set((state: any) => ({ 
        ...state,
        agendamentos: agendamentosConvertidos, 
        agendamentosCompletos: agendamentosCompletosMapa,
        loading: false 
      }));
    } catch (error) {
      console.error('useAgendamentoClienteStore: Erro:', error);
      set((state: any) => ({ 
        ...state,
        error: error instanceof Error ? error.message : 'Erro desconhecido', 
        loading: false 
      }));
    }
  },
  
  carregarAgendamentoPorCliente: async (clienteId: string) => {
    try {
      // Primeiro verificar se já temos no cache
      const cache = get().agendamentosCompletos;
      if (cache.has(clienteId)) {
        console.log('useAgendamentoClienteStore: Usando cache para cliente:', clienteId);
        return cache.get(clienteId)!;
      }

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
      
      // Atualizar cache
      if (agendamento) {
        const novoCache = new Map(get().agendamentosCompletos);
        novoCache.set(clienteId, agendamento);
        set((state: any) => ({ ...state, agendamentosCompletos: novoCache }));
      }

      console.log('useAgendamentoClienteStore: Agendamento carregado:', agendamento);
      
      if (agendamento && agendamento.tipo_pedido === 'Alterado') {
        console.log('🔍 Agendamento Alterado carregado:', {
          tipo: agendamento.tipo_pedido,
          itens_personalizados: agendamento.itens_personalizados,
          quantidade_total: agendamento.quantidade_total,
          data_proxima_reposicao: agendamento.data_proxima_reposicao,
          contatar_cliente: agendamento.contatar_cliente
        });
      }
      
      return agendamento;
    } catch (error) {
      console.error('useAgendamentoClienteStore: Erro ao carregar agendamento:', error);
      return null;
    }
  },

  salvarAgendamento: async (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => {
    try {
      console.log('useAgendamentoClienteStore: Salvando agendamento para cliente:', clienteId);
      console.log('📊 Dados originais recebidos:', dadosAgendamento);
      
      // Verificar se o agendamento já existe
      const agendamentoExistente = await get().carregarAgendamentoPorCliente(clienteId);
      
      const dadosParaSalvar = {
        cliente_id: clienteId,
        ...convertAgendamentoToDbFormat(dadosAgendamento),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Dados formatados para salvar:', dadosParaSalvar);

      let result;
      if (agendamentoExistente) {
        // CORREÇÃO: Preservar explicitamente a quantidade_total quando fornecida
        const dadosAtualizacao = {
          ...dadosParaSalvar,
          // Preservar tipo_pedido explicitamente
          tipo_pedido: dadosAgendamento.tipo_pedido !== undefined 
            ? dadosAgendamento.tipo_pedido 
            : agendamentoExistente.tipo_pedido,
          // CORREÇÃO PRINCIPAL: Preservar quantidade_total explicitamente quando fornecida
          quantidade_total: dadosAgendamento.quantidade_total !== undefined 
            ? dadosAgendamento.quantidade_total 
            : agendamentoExistente.quantidade_total,
          // Preservar itens_personalizados baseado no tipo de pedido
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
          quantidadeAnterior: agendamentoExistente.quantidade_total,
          quantidadeNova: dadosAtualizacao.quantidade_total,
          quantidadeRecebida: dadosAgendamento.quantidade_total,
          dataAnterior: agendamentoExistente.data_proxima_reposicao,
          dataNova: dadosAtualizacao.data_proxima_reposicao,
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
      console.log('🔍 Validação pós-salvamento - Quantidade salva:', result.data.quantidade_total);
      
      // Atualizar cache
      const novoCache = new Map(get().agendamentosCompletos);
      novoCache.set(clienteId, convertDbRowToAgendamento(result.data));
      set((state: any) => ({ ...state, agendamentosCompletos: novoCache }));
      
      // Recarregar todos os agendamentos para atualizar a lista
      await get().carregarTodosAgendamentos();

    } catch (error) {
      console.error('useAgendamentoClienteStore: Erro ao salvar agendamento:', error);
      toast.error('Erro ao salvar agendamento');
      throw error;
    }
  },

  criarAgendamentoSeNaoExiste: async (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => {
    const agendamentoExistente = await get().carregarAgendamentoPorCliente(clienteId);
    
    if (!agendamentoExistente) {
      await get().salvarAgendamento(clienteId, dadosIniciais);
    }
  },

  atualizarContatarCliente: async (clienteId: string, contatar: boolean) => {
    try {
      console.log('useAgendamentoClienteStore: Atualizando contatar_cliente para cliente:', clienteId, contatar);
      
      // Verificar se o agendamento existe
      const agendamentoExistente = await get().carregarAgendamentoPorCliente(clienteId);
      
      if (!agendamentoExistente) {
        // Criar agendamento básico se não existir
        await get().criarAgendamentoSeNaoExiste(clienteId, {
          contatar_cliente: contatar,
          status_agendamento: 'Agendar',
          tipo_pedido: 'Padrão',
          quantidade_total: 0
        });
        return;
      }

      const { data, error } = await supabase
        .from('agendamentos_clientes')
        .update({ 
          contatar_cliente: contatar,
          updated_at: new Date().toISOString()
        })
        .eq('cliente_id', clienteId)
        .select()
        .single();

      if (error) {
        console.error('useAgendamentoClienteStore: Erro ao atualizar contatar_cliente:', error);
        throw error;
      }

      console.log('✅ contatar_cliente atualizado com sucesso:', data);
      
      // Atualizar cache
      const novoCache = new Map(get().agendamentosCompletos);
      novoCache.set(clienteId, convertDbRowToAgendamento(data));
      set((state: any) => ({ ...state, agendamentosCompletos: novoCache }));
      
      // Recarregar todos os agendamentos para atualizar a lista
      await get().carregarTodosAgendamentos();

    } catch (error) {
      console.error('useAgendamentoClienteStore: Erro ao atualizar contatar_cliente:', error);
      toast.error('Erro ao atualizar status de contato');
      throw error;
    }
  }
});
