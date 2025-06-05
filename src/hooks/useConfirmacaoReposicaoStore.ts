
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { addDays, differenceInHours } from 'date-fns';

export interface ConfirmacaoReposicao {
  id: string;
  cliente_id: string;
  agendamento_id?: string;
  data_contato: Date;
  ultimo_contato_em?: Date;
  status_contato: 'aguardando_retorno' | 'confirmado' | 'reenviado' | 'nao_respondeu';
  observacoes?: string;
  confirmado_por?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClienteConfirmacao {
  id: string;
  nome: string;
  data_proxima_reposicao: Date;
  tipo_pedido: 'Padrão' | 'Alterado';
  quantidade_total: number;
  ultimo_contato_em?: Date;
  status_contato: string;
  horas_desde_ultimo_contato?: number;
  pode_reenviar: boolean;
  em_atraso: boolean;
}

interface ConfirmacaoReposicaoStore {
  clientesParaConfirmacao: ClienteConfirmacao[];
  confirmacoes: ConfirmacaoReposicao[];
  loading: boolean;
  error: string | null;
  
  // Actions
  carregarClientesParaConfirmacao: () => Promise<void>;
  confirmarReposicao: (clienteId: string) => Promise<void>;
  reenviarContato: (clienteId: string) => Promise<void>;
  marcarNaoRespondeu: (clienteId: string) => Promise<void>;
  limparErro: () => void;
}

export const useConfirmacaoReposicaoStore = create<ConfirmacaoReposicaoStore>()(
  devtools(
    (set, get) => ({
      clientesParaConfirmacao: [],
      confirmacoes: [],
      loading: false,
      error: null,

      carregarClientesParaConfirmacao: async () => {
        set({ loading: true, error: null });
        try {
          console.log('useConfirmacaoReposicaoStore: Carregando clientes para confirmação...');
          
          // Data de dois dias à frente
          const dataConfirmacao = addDays(new Date(), 2);
          const dataConfirmacaoStr = dataConfirmacao.toISOString().split('T')[0];
          
          // Buscar agendamentos previstos para daqui 2 dias
          const { data: agendamentos, error: agendamentosError } = await supabase
            .from('agendamentos_clientes')
            .select(`
              *,
              clientes (
                id,
                nome,
                quantidade_padrao
              )
            `)
            .eq('status_agendamento', 'Previsto')
            .eq('data_proxima_reposicao', dataConfirmacaoStr);

          if (agendamentosError) {
            console.error('useConfirmacaoReposicaoStore: Erro ao carregar agendamentos:', agendamentosError);
            throw agendamentosError;
          }

          // Buscar confirmações existentes
          const { data: confirmacoes, error: confirmacoesError } = await supabase
            .from('confirmacoes_reposicao')
            .select('*');

          if (confirmacoesError) {
            console.error('useConfirmacaoReposicaoStore: Erro ao carregar confirmações:', confirmacoesError);
            throw confirmacoesError;
          }

          // Processar clientes com dados de confirmação
          const clientesComConfirmacao = agendamentos?.map(agendamento => {
            const cliente = agendamento.clientes;
            const confirmacao = confirmacoes?.find(c => c.cliente_id === cliente.id);
            
            const ultimoContato = confirmacao?.ultimo_contato_em ? new Date(confirmacao.ultimo_contato_em) : undefined;
            const horasDesdeUltimoContato = ultimoContato ? differenceInHours(new Date(), ultimoContato) : 0;
            
            return {
              id: cliente.id,
              nome: cliente.nome,
              data_proxima_reposicao: new Date(agendamento.data_proxima_reposicao + 'T00:00:00'),
              tipo_pedido: agendamento.tipo_pedido as 'Padrão' | 'Alterado',
              quantidade_total: agendamento.quantidade_total || cliente.quantidade_padrao || 0,
              ultimo_contato_em: ultimoContato,
              status_contato: confirmacao?.status_contato || 'aguardando_retorno',
              horas_desde_ultimo_contato: horasDesdeUltimoContato,
              pode_reenviar: horasDesdeUltimoContato >= 24,
              em_atraso: horasDesdeUltimoContato >= 48
            };
          }) || [];
          
          console.log('useConfirmacaoReposicaoStore: Clientes para confirmação carregados:', clientesComConfirmacao.length);
          set({ 
            clientesParaConfirmacao: clientesComConfirmacao,
            confirmacoes: confirmacoes || [],
            loading: false 
          });
        } catch (error) {
          console.error('useConfirmacaoReposicaoStore: Erro:', error);
          set({ error: error instanceof Error ? error.message : 'Erro desconhecido', loading: false });
        }
      },

      confirmarReposicao: async (clienteId: string) => {
        try {
          console.log('useConfirmacaoReposicaoStore: Confirmando reposição para cliente:', clienteId);
          
          // Atualizar status do agendamento para "Agendado"
          const { error: agendamentoError } = await supabase
            .from('agendamentos_clientes')
            .update({ status_agendamento: 'Agendado' })
            .eq('cliente_id', clienteId);

          if (agendamentoError) {
            throw agendamentoError;
          }

          // Registrar confirmação
          const { error: confirmacaoError } = await supabase
            .from('confirmacoes_reposicao')
            .upsert({
              cliente_id: clienteId,
              status_contato: 'confirmado',
              ultimo_contato_em: new Date().toISOString(),
              confirmado_por: 'Sistema'
            });

          if (confirmacaoError) {
            throw confirmacaoError;
          }

          // Recarregar dados
          await get().carregarClientesParaConfirmacao();
          
          toast.success('Reposição confirmada com sucesso!');
        } catch (error) {
          console.error('useConfirmacaoReposicaoStore: Erro ao confirmar reposição:', error);
          toast.error('Erro ao confirmar reposição');
          throw error;
        }
      },

      reenviarContato: async (clienteId: string) => {
        try {
          console.log('useConfirmacaoReposicaoStore: Reenviando contato para cliente:', clienteId);
          
          const { error } = await supabase
            .from('confirmacoes_reposicao')
            .upsert({
              cliente_id: clienteId,
              status_contato: 'reenviado',
              ultimo_contato_em: new Date().toISOString()
            });

          if (error) {
            throw error;
          }

          await get().carregarClientesParaConfirmacao();
          toast.success('Contato reenviado!');
        } catch (error) {
          console.error('useConfirmacaoReposicaoStore: Erro ao reenviar contato:', error);
          toast.error('Erro ao reenviar contato');
          throw error;
        }
      },

      marcarNaoRespondeu: async (clienteId: string) => {
        try {
          console.log('useConfirmacaoReposicaoStore: Marcando como não respondeu:', clienteId);
          
          const { error } = await supabase
            .from('confirmacoes_reposicao')
            .upsert({
              cliente_id: clienteId,
              status_contato: 'nao_respondeu'
            });

          if (error) {
            throw error;
          }

          await get().carregarClientesParaConfirmacao();
          toast.success('Marcado como não respondeu');
        } catch (error) {
          console.error('useConfirmacaoReposicaoStore: Erro ao marcar não respondeu:', error);
          toast.error('Erro ao atualizar status');
          throw error;
        }
      },

      limparErro: () => set({ error: null })
    }),
    { name: 'confirmacao-reposicao-store' }
  )
);
