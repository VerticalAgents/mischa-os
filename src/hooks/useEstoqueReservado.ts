
import { useState, useEffect } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useProporoesPadrao } from './useProporoesPadrao';

interface EstoqueReservado {
  [nomeProduto: string]: number;
}

export const useEstoqueReservado = () => {
  const { pedidos } = useExpedicaoStore();
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const [quantidadesReservadas, setQuantidadesReservadas] = useState<EstoqueReservado>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calcularReservas = async () => {
      setIsLoading(true);
      const reservas: EstoqueReservado = {};

      // Filtrar apenas pedidos separados ou despachados (que ocupam estoque)
      const pedidosReservados = pedidos.filter(pedido => 
        pedido.substatus_pedido === 'Separado' || pedido.substatus_pedido === 'Despachado'
      );

      for (const pedido of pedidosReservados) {
        if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
          // Pedido alterado - usar itens personalizados
          pedido.itens_personalizados.forEach((item: any) => {
            const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
            reservas[nomeProduto] = (reservas[nomeProduto] || 0) + item.quantidade;
          });
        } else {
          // Pedido padrão - usar proporções cadastradas
          try {
            const quantidadesProporcao = await calcularQuantidadesPorProporcao(pedido.quantidade_total);
            quantidadesProporcao.forEach(item => {
              reservas[item.produto] = (reservas[item.produto] || 0) + item.quantidade;
            });
          } catch (error) {
            console.warn('Erro ao calcular proporções para reserva:', pedido.id, error);
          }
        }
      }

      setQuantidadesReservadas(reservas);
      setIsLoading(false);
    };

    calcularReservas();
  }, [pedidos, calcularQuantidadesPorProporcao]);

  const obterQuantidadeReservada = (nomeProduto: string): number => {
    return quantidadesReservadas[nomeProduto] || 0;
  };

  const obterEstoqueDisponivel = (nomeProduto: string, estoqueAtual: number): number => {
    const quantidadeReservada = obterQuantidadeReservada(nomeProduto);
    return Math.max(0, estoqueAtual - quantidadeReservada);
  };

  return {
    quantidadesReservadas,
    obterQuantidadeReservada,
    obterEstoqueDisponivel,
    isLoading
  };
};
