
import { useState, useEffect } from 'react';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useSupabaseProdutos } from './useSupabaseProdutos';

interface QuantidadeReservada {
  produto: string;
  quantidade: number;
}

export const useEstoqueReservado = () => {
  const { pedidos } = useExpedicaoStore();
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao';
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  
  const [quantidadesReservadas, setQuantidadesReservadas] = useState<{ [nome: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calcularQuantidadesReservadas = async () => {
      if (loadingProdutos) {
        setLoading(true);
        return;
      }

      setLoading(true);
      try {
        const quantidadesPorProduto: { [nome: string]: number } = {};
        
        // Filtrar pedidos que estão separados ou despachados (independente da data)
        const pedidosReservados = pedidos.filter(pedido => 
          pedido.substatus_pedido === 'Separado' || pedido.substatus_pedido === 'Despachado'
        );

        console.log('🔢 Calculando quantidades reservadas para', pedidosReservados.length, 'pedidos');

        for (const pedido of pedidosReservados) {
          if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados?.length > 0) {
            // Pedido alterado - usar itens personalizados
            pedido.itens_personalizados.forEach((item: any) => {
              const nomeProduto = item.produto || item.nome || 'Produto desconhecido';
              quantidadesPorProduto[nomeProduto] = (quantidadesPorProduto[nomeProduto] || 0) + item.quantidade;
            });
          } else {
            // Pedido padrão - usar proporções cadastradas
            try {
              const quantidadesProporcao = await calcularQuantidadesPorProporcao(pedido.quantidade_total);
              quantidadesProporcao.forEach(item => {
                quantidadesPorProduto[item.produto] = (quantidadesPorProduto[item.produto] || 0) + item.quantidade;
              });
            } catch (error) {
              console.warn('Erro ao calcular proporções para pedido reservado:', pedido.id, error);
              
              // Fallback: distribuir igualmente entre produtos ativos
              const produtosAtivos = produtos.filter(p => p.ativo);
              if (produtosAtivos.length > 0) {
                const quantidadePorProduto = Math.floor(pedido.quantidade_total / produtosAtivos.length);
                const resto = pedido.quantidade_total % produtosAtivos.length;
                
                produtosAtivos.forEach((produto, index) => {
                  const quantidade = quantidadePorProduto + (index < resto ? 1 : 0);
                  quantidadesPorProduto[produto.nome] = (quantidadesPorProduto[produto.nome] || 0) + quantidade;
                });
              }
            }
          }
        }
        
        console.log('✅ Quantidades reservadas calculadas:', quantidadesPorProduto);
        setQuantidadesReservadas(quantidadesPorProduto);
      } catch (error) {
        console.error('Erro ao calcular quantidades reservadas:', error);
        setQuantidadesReservadas({});
      } finally {
        setLoading(false);
      }
    };
    
    calcularQuantidadesReservadas();
  }, [pedidos, calcularQuantidadesPorProporcao, produtos, loadingProdutos]);

  const obterQuantidadeReservada = (nomeProduto: string): number => {
    return quantidadesReservadas[nomeProduto] || 0;
  };

  return {
    quantidadesReservadas,
    loading,
    obterQuantidadeReservada
  };
};
