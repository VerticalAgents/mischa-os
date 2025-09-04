import { useState, useEffect } from 'react';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useEstoqueProdutos } from './useEstoqueProdutos';

export const useQuantidadesSeparadas = (pedidosSeparados: any[], pedidosDespachados: any[]) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos } = useEstoqueProdutos();
  const [quantidadesPorProduto, setQuantidadesPorProduto] = useState<{ [nome: string]: number }>({});
  const [calculando, setCalculando] = useState(true);

  // Combinar todos os pedidos (separados + despachados)
  const todosPedidos = [...pedidosSeparados, ...pedidosDespachados];

  const calcularQuantidadesTotais = async () => {
    const quantidadesPorProduto: { [nome: string]: number } = {};
    
    for (const pedido of todosPedidos) {
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
        const quantidades = await calcularQuantidadesTotais();
        setQuantidadesPorProduto(quantidades);
      } catch (error) {
        console.error('Erro ao calcular quantidades separadas:', error);
        setQuantidadesPorProduto({});
      } finally {
        setCalculando(false);
      }
    };

    carregarQuantidades();
  }, [pedidosSeparados, pedidosDespachados, produtos]);

  return {
    quantidadesPorProduto,
    calculando,
    obterQuantidadeProduto: (nomeProduto: string): number => {
      return quantidadesPorProduto[nomeProduto] || 0;
    }
  };
};