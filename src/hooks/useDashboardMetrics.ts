
import { useMemo } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useConfirmacaoReposicaoStore } from './useConfirmacaoReposicaoStore';
import { useEstoqueProdutos } from './useEstoqueProdutos';
import { useSupabaseHistoricoProducao } from './useSupabaseHistoricoProducao';
import { format, isToday, isBefore, startOfDay } from 'date-fns';

export const useDashboardMetrics = () => {
  const { pedidosSeparacao } = useExpedicaoStore();
  const { clientesParaConfirmacao } = useConfirmacaoReposicaoStore();
  const { produtos: produtosEstoque } = useEstoqueProdutos();
  const { historico } = useSupabaseHistoricoProducao();

  // Agendamentos críticos
  const agendamentosCriticos = useMemo(() => {
    const hoje = startOfDay(new Date());
    const pedidosHoje = pedidosSeparacao.filter(pedido => {
      const dataEntrega = new Date(pedido.data_entrega);
      return isToday(dataEntrega) || isBefore(dataEntrega, hoje);
    });
    
    const atrasados = pedidosHoje.filter(pedido => 
      isBefore(new Date(pedido.data_entrega), hoje)
    );

    return {
      total: pedidosHoje.length,
      atrasados: atrasados.length,
      percentualAtraso: pedidosHoje.length > 0 ? (atrasados.length / pedidosHoje.length) * 100 : 0
    };
  }, [pedidosSeparacao]);

  // Separação de pedidos
  const separacaoPedidos = useMemo(() => {
    const aguardandoSeparacao = pedidosSeparacao.filter(p => p.substatus_pedido === 'Agendado');
    const separados = pedidosSeparacao.filter(p => p.substatus_pedido === 'Separado');
    
    return {
      aguardando: aguardandoSeparacao.length,
      separados: separados.length,
      total: pedidosSeparacao.length
    };
  }, [pedidosSeparacao]);

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
