
import { useMemo } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useConfirmacaoReposicaoStore } from './useConfirmacaoReposicaoStore';
import { useEstoqueProdutos } from './useEstoqueProdutos';
import { useSupabaseHistoricoProducao } from './useSupabaseHistoricoProducao';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { format, isToday, isBefore, startOfDay, isSameDay } from 'date-fns';

export const useDashboardMetrics = () => {
  const { pedidos } = useExpedicaoStore();
  const { clientesParaConfirmacao } = useConfirmacaoReposicaoStore();
  const { produtos: produtosEstoque } = useEstoqueProdutos();
  const { historico } = useSupabaseHistoricoProducao();
  const { agendamentos } = useAgendamentoClienteStore();

  // Agendamentos críticos - CORRIGIDO para usar dados reais de agendamentos
  const agendamentosCriticos = useMemo(() => {
    const hoje = new Date();
    
    // Filtrar agendamentos para hoje
    const agendamentosHoje = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return isSameDay(dataAgendamento, hoje);
    });
    
    // Contar agendamentos atrasados (data anterior a hoje)
    const agendamentosAtrasados = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return isBefore(dataAgendamento, startOfDay(hoje));
    });

    console.log('Dashboard Metrics - Agendamentos calculados:', {
      total_hoje: agendamentosHoje.length,
      atrasados: agendamentosAtrasados.length,
      agendamentos_hoje_detalhes: agendamentosHoje.map(a => ({
        cliente: a.cliente.nome,
        status: a.statusAgendamento,
        data: a.dataReposicao
      }))
    });

    return {
      total: agendamentosHoje.length,
      atrasados: agendamentosAtrasados.length,
      percentualAtraso: agendamentosHoje.length > 0 ? (agendamentosAtrasados.length / agendamentosHoje.length) * 100 : 0
    };
  }, [agendamentos]);

  // Separação de pedidos
  const separacaoPedidos = useMemo(() => {
    const aguardandoSeparacao = pedidos.filter(p => p.substatus_pedido === 'Agendado');
    const separados = pedidos.filter(p => p.substatus_pedido === 'Separado');
    
    return {
      aguardando: aguardandoSeparacao.length,
      separados: separados.length,
      total: pedidos.length
    };
  }, [pedidos]);

  // Confirmações pendentes
  const confirmacoesPendentes = useMemo(() => {
    const aguardando = clientesParaConfirmacao.filter(c => c.status_contato === 'aguardando_retorno');
    const criticos = aguardando.filter(c => c.em_atraso);
    
    return {
      total: aguardando.length,
      criticos: criticos.length,
      percentualCritico: aguardando.length > 0 ? (criticos.length / aguardando.length) * 100 : 0
    };
  }, [clientesParaConfirmacao]);

  // Produção do dia
  const producaoDia = useMemo(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const producaoHoje = historico.filter(h => 
      format(new Date(h.data_producao), 'yyyy-MM-dd') === hoje
    );
    
    const confirmados = producaoHoje.filter(h => h.status === 'Confirmado');
    const pendentes = producaoHoje.filter(h => h.status === 'Registrado');
    const totalUnidades = producaoHoje.reduce((sum, h) => sum + h.unidades_calculadas, 0);
    
    return {
      registros: producaoHoje.length,
      confirmados: confirmados.length,
      pendentes: pendentes.length,
      totalUnidades
    };
  }, [historico]);

  return {
    agendamentosCriticos,
    separacaoPedidos,
    confirmacoesPendentes,
    producaoDia
  };
};
