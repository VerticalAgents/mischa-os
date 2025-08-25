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
  const { historico, loading: loadingHistorico } = useSupabaseHistoricoProducao();
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

  // Confirmações semanais - agendamentos com status "Previsto" da semana atual
  const confirmacoesPendentesSemanais = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Segunda-feira
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 }); // Domingo
    
    // Filtrar agendamentos da semana atual com status "Previsto" (aguardando confirmação)
    const agendamentosPrevistosSemana = agendamentos.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      return isWithinInterval(dataReposicao, { start: inicioSemana, end: fimSemana }) 
             && agendamento.statusAgendamento === 'Previsto';
    });
    
    // Verificar quais estão em atraso (data já passou)
    const agora = new Date();
    const emAtraso = agendamentosPrevistosSemana.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      return isBefore(dataReposicao, agora);
    });
    
    console.log('Dashboard Metrics - Confirmações semanais (Previstos):', {
      semana_total_previstos: agendamentosPrevistosSemana.length,
      em_atraso: emAtraso.length,
      detalhes: agendamentosPrevistosSemana.map(a => ({
        cliente: a.cliente.nome,
        data: a.dataReposicao,
        status: a.statusAgendamento
      }))
    });
    
    return {
      total: agendamentosPrevistosSemana.length,
      criticos: emAtraso.length,
      percentualCritico: agendamentosPrevistosSemana.length > 0 ? (emAtraso.length / agendamentosPrevistosSemana.length) * 100 : 0
    };
  }, [agendamentos]);

  // Fase 2 e 3: Produção do dia com correção de timezone
  const producaoDia = useMemo(() => {
    // Evitar cálculos enquanto ainda está carregando
    if (loadingHistorico) {
      console.log('Dashboard Metrics - Produção hoje: ainda carregando...');
      return {
        registros: 0,
        confirmados: 0,
        pendentes: 0,
        totalFormas: 0,
        totalUnidades: 0
      };
    }

    // CORREÇÃO: Usar string simples para evitar problemas de timezone
    const hoje = format(new Date(), 'yyyy-MM-dd');
    
    console.log('Dashboard Metrics - Debug Produção (CORREÇÃO):', {
      hoje_string: hoje,
      total_historico: historico.length,
      sample_records: historico.slice(0, 3).map(h => ({
        id: h.id,
        data_producao: h.data_producao,
        produto: h.produto_nome,
        status: h.status,
        match_hoje: h.data_producao === hoje
      }))
    });

    // CORREÇÃO: Comparação direta de strings, sem conversão de Date
    const producaoHoje = historico.filter(h => {
      const matchHoje = h.data_producao === hoje;
      
      if (matchHoje) {
        console.log('Dashboard Metrics - Registro ENCONTRADO para hoje:', {
          id: h.id,
          produto: h.produto_nome,
          formas: h.formas_producidas,
          unidades: h.unidades_calculadas,
          status: h.status,
          data_producao: h.data_producao
        });
      }
      
      return matchHoje;
    });
    
    const confirmados = producaoHoje.filter(h => h.status === 'Confirmado');
    const pendentes = producaoHoje.filter(h => h.status === 'Registrado');
    const totalFormas = producaoHoje.reduce((sum, h) => sum + h.formas_producidas, 0);
    const totalUnidades = producaoHoje.reduce((sum, h) => sum + h.unidades_calculadas, 0);
    
    console.log('Dashboard Metrics - Produção hoje (RESULTADO FINAL CORRIGIDO):', {
      registros_hoje: producaoHoje.length,
      confirmados: confirmados.length,
      pendentes: pendentes.length,
      total_formas: totalFormas,
      total_unidades: totalUnidades,
      loading_historico: loadingHistorico,
      detalhes_completos: producaoHoje.map(h => ({
        id: h.id,
        produto: h.produto_nome,
        status: h.status,
        formas: h.formas_producidas,
        unidades: h.unidades_calculadas,
        data_producao: h.data_producao
      }))
    });
    
    return {
      registros: producaoHoje.length,
      confirmados: confirmados.length,
      pendentes: pendentes.length,
      totalFormas,
      totalUnidades
    };
  }, [historico, loadingHistorico]);

  return {
    agendamentosHoje,
    separacaoPedidos,
    pedidosDespachados,
    confirmacoesPendentesSemanais,
    producaoDia
  };
};
