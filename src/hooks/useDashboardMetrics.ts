
import { useMemo } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useConfirmacaoReposicaoStore } from './useConfirmacaoReposicaoStore';
import { useEstoqueProdutos } from './useEstoqueProdutos';
import { useSupabaseHistoricoProducao } from './useSupabaseHistoricoProducao';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { format, isToday, isBefore, startOfDay, isSameDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export const useDashboardMetrics = () => {
  const { pedidos } = useExpedicaoStore();
  const { clientesParaConfirmacao } = useConfirmacaoReposicaoStore();
  const { produtos: produtosEstoque } = useEstoqueProdutos();
  const { historico } = useSupabaseHistoricoProducao();
  const { agendamentos } = useAgendamentoClienteStore();

  // Agendamentos para hoje - separando por status
  const agendamentosHoje = useMemo(() => {
    const hoje = new Date();
    
    // Filtrar agendamentos para hoje
    const agendamentosDodia = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      return isSameDay(dataAgendamento, hoje);
    });
    
    // Separar por status
    const agendados = agendamentosDodia.filter(a => a.statusAgendamento === 'Agendado');
    const previstos = agendamentosDodia.filter(a => a.statusAgendamento === 'Previsto');

    console.log('Dashboard Metrics - Agendamentos hoje:', {
      total: agendamentosDodia.length,
      agendados: agendados.length,
      previstos: previstos.length,
      detalhes: agendamentosDodia.map(a => ({
        cliente: a.cliente.nome,
        status: a.statusAgendamento,
        data: a.dataReposicao
      }))
    });

    return {
      total: agendamentosDodia.length,
      agendados: agendados.length,
      previstos: previstos.length
    };
  }, [agendamentos]);

  // Separação de pedidos - apenas pedidos de hoje
  const separacaoPedidos = useMemo(() => {
    const hoje = new Date();
    
    // Filtrar pedidos apenas para hoje
    const pedidosHoje = pedidos.filter(pedido => {
      const dataPrevista = new Date(pedido.data_prevista_entrega);
      return isSameDay(dataPrevista, hoje);
    });
    
    const aguardandoSeparacao = pedidosHoje.filter(p => p.substatus_pedido === 'Agendado');
    const separados = pedidosHoje.filter(p => p.substatus_pedido === 'Separado');
    
    console.log('Dashboard Metrics - Separação pedidos:', {
      pedidos_hoje: pedidosHoje.length,
      aguardando: aguardandoSeparacao.length,
      separados: separados.length
    });
    
    return {
      aguardando: aguardandoSeparacao.length,
      separados: separados.length,
      total: pedidosHoje.length
    };
  }, [pedidos]);

  // Pedidos despachados hoje - NOVO CARD
  const pedidosDespachados = useMemo(() => {
    const hoje = new Date();
    
    const despachados = pedidos.filter(pedido => {
      const dataPrevista = new Date(pedido.data_prevista_entrega);
      return isSameDay(dataPrevista, hoje) && pedido.substatus_pedido === 'Despachado';
    });
    
    console.log('Dashboard Metrics - Pedidos despachados:', {
      despachados: despachados.length
    });
    
    return {
      total: despachados.length
    };
  }, [pedidos]);

  // Confirmações pendentes - ALTERADO PARA ESCOPO SEMANAL
  const confirmacoesPendentesSemanais = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda-feira
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 }); // Domingo
    
    // Filtrar confirmações da semana atual
    const confirmacoesSemana = clientesParaConfirmacao.filter(cliente => {
      const dataReposicao = new Date(cliente.data_proxima_reposicao);
      return isWithinInterval(dataReposicao, { start: inicioSemana, end: fimSemana });
    });
    
    const aguardando = confirmacoesSemana.filter(c => c.status_contato === 'aguardando_retorno');
    const criticos = aguardando.filter(c => c.em_atraso);
    
    console.log('Dashboard Metrics - Confirmações semanais:', {
      semana_total: confirmacoesSemana.length,
      aguardando: aguardando.length,
      criticos: criticos.length
    });
    
    return {
      total: aguardando.length,
      criticos: criticos.length,
      percentualCritico: aguardando.length > 0 ? (criticos.length / aguardando.length) * 100 : 0
    };
  }, [clientesParaConfirmacao]);

  // Produção do dia - CORRIGIDO para usar dados reais do histórico
  const producaoDia = useMemo(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const producaoHoje = historico.filter(h => {
      const dataProducao = format(new Date(h.data_producao), 'yyyy-MM-dd');
      return dataProducao === hoje;
    });
    
    const confirmados = producaoHoje.filter(h => h.status === 'Confirmado');
    const pendentes = producaoHoje.filter(h => h.status === 'Registrado');
    const totalUnidades = producaoHoje.reduce((sum, h) => sum + h.unidades_calculadas, 0);
    
    console.log('Dashboard Metrics - Produção hoje:', {
      registros_hoje: producaoHoje.length,
      confirmados: confirmados.length,
      pendentes: pendentes.length,
      total_unidades: totalUnidades,
      detalhes: producaoHoje.map(h => ({
        produto: h.produto_nome,
        status: h.status,
        unidades: h.unidades_calculadas
      }))
    });
    
    return {
      registros: producaoHoje.length,
      confirmados: confirmados.length,
      pendentes: pendentes.length,
      totalUnidades
    };
  }, [historico]);

  return {
    agendamentosHoje,
    separacaoPedidos,
    pedidosDespachados,
    confirmacoesPendentesSemanais,
    producaoDia
  };
};
