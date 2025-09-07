import { useState, useEffect } from 'react';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useEstoqueProdutos } from './useEstoqueProdutos';

export interface QuantidadesExpedicao {
  quantidadesSeparadas: { [nome: string]: number };
  quantidadesDespachadas: { [nome: string]: number };
  calculando: boolean;
}

export const useQuantidadesExpedicao = (pedidosSeparados: any[], pedidosDespachados: any[]) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos } = useEstoqueProdutos();
  const [quantidadesSeparadas, setQuantidadesSeparadas] = useState<{ [nome: string]: number }>({});
  const [quantidadesDespachadas, setQuantidadesDespachadas] = useState<{ [nome: string]: number }>({});
  const [calculando, setCalculando] = useState(true);

  const calcularQuantidadesPorPedidos = async (pedidos: any[]) => {
    const quantidadesPorProduto: { [nome: string]: number } = {};
    
    for (const pedido of pedidos) {
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
          console.warn('Erro ao calcular proporções para pedido:', pedido.id, error);
          
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
    
    return quantidadesPorProduto;
  };

  useEffect(() => {
    const carregarQuantidades = async () => {
      if (produtos.length === 0) return;
      
      setCalculando(true);
      try {
        // Calcular separadamente para cada status
        const [separadas, despachadas] = await Promise.all([
          calcularQuantidadesPorPedidos(pedidosSeparados),
          calcularQuantidadesPorPedidos(pedidosDespachados)
        ]);
        
        setQuantidadesSeparadas(separadas);
        setQuantidadesDespachadas(despachadas);
      } catch (error) {
        console.error('Erro ao calcular quantidades da expedição:', error);
        setQuantidadesSeparadas({});
        setQuantidadesDespachadas({});
      } finally {
        setCalculando(false);
      }
    };

    carregarQuantidades();
  }, [pedidosSeparados, pedidosDespachados, produtos]);

  return {
    quantidadesSeparadas,
    quantidadesDespachadas,
    calculando,
    obterQuantidadeSeparada: (nomeProduto: string): number => {
      return quantidadesSeparadas[nomeProduto] || 0;
    },
    obterQuantidadeDespachada: (nomeProduto: string): number => {
      return quantidadesDespachadas[nomeProduto] || 0;
    },
    obterQuantidadeTotal: (nomeProduto: string): number => {
      return (quantidadesSeparadas[nomeProduto] || 0) + (quantidadesDespachadas[nomeProduto] || 0);
    }
  };
};