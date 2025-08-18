
import { useMemo } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useConfirmacaoReposicaoStore } from './useConfirmacaoReposicaoStore';
import { useEstoqueProdutos } from './useEstoqueProdutos';
import { isBefore, startOfDay } from 'date-fns';

export interface CriticalAlert {
  id: string;
  type: 'estoque' | 'entrega' | 'confirmacao';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  count: number;
  actionText: string;
  actionRoute: string;
}

export const useCriticalAlerts = () => {
  const { pedidosSeparacao } = useExpedicaoStore();
  const { clientesParaConfirmacao } = useConfirmacaoReposicaoStore();
  const { produtos } = useEstoqueProdutos();

  const alerts = useMemo((): CriticalAlert[] => {
    const alertsList: CriticalAlert[] = [];

    // Estoque baixo
    const produtosEstoqueBaixo = produtos.filter(p => 
      p.ativo && p.estoque_atual < p.estoque_minimo
    );
    
    if (produtosEstoqueBaixo.length > 0) {
      alertsList.push({
        id: 'estoque-baixo',
        type: 'estoque',
        severity: produtosEstoqueBaixo.length > 5 ? 'critical' : 'high',
        title: 'Estoque Baixo',
        message: `${produtosEstoqueBaixo.length} produtos abaixo do estoque mínimo`,
        count: produtosEstoqueBaixo.length,
        actionText: 'Ver Estoque',
        actionRoute: '/estoque/insumos'
      });
    }

    // Entregas atrasadas
    const hoje = startOfDay(new Date());
    const entregasAtrasadas = pedidosSeparacao.filter(p => 
      isBefore(new Date(p.data_entrega), hoje) && 
      !['Entregue', 'Despachado'].includes(p.substatus_pedido)
    );
    
    if (entregasAtrasadas.length > 0) {
      alertsList.push({
        id: 'entregas-atrasadas',
        type: 'entrega',
        severity: entregasAtrasadas.length > 3 ? 'critical' : 'high',
        title: 'Entregas Atrasadas',
        message: `${entregasAtrasadas.length} entregas em atraso`,
        count: entregasAtrasadas.length,
        actionText: 'Ver Expedição',
        actionRoute: '/expedicao'
      });
    }

    // Confirmações em atraso
    const confirmacoesAtraso = clientesParaConfirmacao.filter(c => c.em_atraso);
    
    if (confirmacoesAtraso.length > 0) {
      alertsList.push({
        id: 'confirmacoes-atraso',
        type: 'confirmacao',
        severity: confirmacoesAtraso.length > 5 ? 'critical' : 'medium',
        title: 'Confirmações em Atraso',
        message: `${confirmacoesAtraso.length} clientes há mais de 48h sem resposta`,
        count: confirmacoesAtraso.length,
        actionText: 'Ver Confirmações',
        actionRoute: '/agendamento?tab=confirmacao'
      });
    }

    return alertsList.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }, [pedidosSeparacao, clientesParaConfirmacao, produtos]);

  return { alerts };
};
