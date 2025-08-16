
import { useMemo } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useProporoesPadrao } from './useProporoesPadrao';

interface EstoqueReservado {
  [nomeProduto: string]: number;
}

export const useEstoqueReservado = () => {
  const { pedidos } = useExpedicaoStore();
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();

  const estoqueReservado = useMemo((): EstoqueReservado => {
    const reservado: EstoqueReservado = {};

    // Filtrar apenas pedidos separados (que estão na aba de despacho)
    const pedidosSeparados = pedidos.filter(pedido => 
      pedido.substatus_pedido === 'Separado' || pedido.substatus_pedido === 'Despachado'
    );

    pedidosSeparados.forEach(pedido => {
      if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
        // Pedido alterado - usar itens personalizados
        pedido.itens_personalizados.forEach((item: any) => {
          const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
          reservado[nomeProduto] = (reservado[nomeProduto] || 0) + item.quantidade;
        });
      } else {
        // Pedido padrão - usar proporções cadastradas
        try {
          const quantidadesProporcao = calcularQuantidadesPorProporcao(pedido.quantidade_total);
          quantidadesProporcao.forEach(item => {
            reservado[item.produto] = (reservado[item.produto] || 0) + item.quantidade;
          });
        } catch (error) {
          console.warn('Erro ao calcular proporções para pedido reservado:', pedido.id, error);
        }
      }
    });

    return reservado;
  }, [pedidos, calcularQuantidadesPorProporcao]);

  const obterQuantidadeReservada = (nomeProduto: string): number => {
    return estoqueReservado[nomeProduto] || 0;
  };

  return {
    estoqueReservado,
    obterQuantidadeReservada
  };
};
