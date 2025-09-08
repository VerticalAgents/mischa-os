import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useEstoqueProdutos } from './useEstoqueProdutos';
import { useQuantidadesCache } from './useQuantidadesCache';

export interface QuantidadesExpedicao {
  quantidadesSeparadas: { [nome: string]: number };
  quantidadesDespachadas: { [nome: string]: number };
  calculando: boolean;
}

export const useQuantidadesExpedicao = (pedidosSeparados: any[], pedidosDespachados: any[]) => {
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos } = useEstoqueProdutos();
  const { getFromCache, setToCache } = useQuantidadesCache();
  const [quantidadesSeparadas, setQuantidadesSeparadas] = useState<{ [nome: string]: number }>({});
  const [quantidadesDespachadas, setQuantidadesDespachadas] = useState<{ [nome: string]: number }>({});
  const [calculando, setCalculando] = useState(true);

  // Criar chave de cache estável baseada no conteúdo dos pedidos
  const cacheKey = useMemo(() => {
    const separadosIds = pedidosSeparados?.map(p => `${p.id}-${p.quantidade_total}-${p.tipo_pedido}`).sort().join('|') || '';
    const despachadosIds = pedidosDespachados?.map(p => `${p.id}-${p.quantidade_total}-${p.tipo_pedido}`).sort().join('|') || '';
    return `quantidades-${separadosIds}-${despachadosIds}`;
  }, [pedidosSeparados, pedidosDespachados]);

  // Memoizar arrays para evitar re-renders desnecessários
  const pedidosSeparadosMemo = useMemo(() => pedidosSeparados || [], [pedidosSeparados]);
  const pedidosDespachadosMemo = useMemo(() => pedidosDespachados || [], [pedidosDespachados]);

  // Memoizar função de cálculo para evitar recálculos desnecessários
  const calcularQuantidadesPorPedidos = useCallback(async (pedidos: any[]) => {
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
  }, [produtos, calcularQuantidadesPorProporcao]);

  // Memoizar função de carregamento com cache
  const carregarQuantidades = useCallback(async () => {
    if (produtos.length === 0) return;
    
    // Verificar cache primeiro
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('✅ Usando quantidades do cache');
      setQuantidadesSeparadas(cached.separadas);
      setQuantidadesDespachadas(cached.despachadas);
      setCalculando(false);
      return;
    }
    
    setCalculando(true);
    try {
      console.log('🔄 Calculando quantidades separadas e despachadas...');
      console.log('📊 Pedidos separados:', pedidosSeparadosMemo.length);
      console.log('📊 Pedidos despachados:', pedidosDespachadosMemo.length);

      // Calcular separadamente para cada status
      const [separadas, despachadas] = await Promise.all([
        calcularQuantidadesPorPedidos(pedidosSeparadosMemo),
        calcularQuantidadesPorPedidos(pedidosDespachadosMemo)
      ]);
      
      // Salvar no cache
      setToCache(cacheKey, { separadas, despachadas });
      
      setQuantidadesSeparadas(separadas);
      setQuantidadesDespachadas(despachadas);
      
      console.log('✅ Quantidades calculadas e armazenadas no cache:');
      console.log('📦 Separadas:', separadas);
      console.log('🚚 Despachadas:', despachadas);
    } catch (error) {
      console.error('Erro ao calcular quantidades da expedição:', error);
      setQuantidadesSeparadas({});
      setQuantidadesDespachadas({});
    } finally {
      setCalculando(false);
    }
  }, [produtos.length, cacheKey, pedidosSeparadosMemo, pedidosDespachadosMemo, calcularQuantidadesPorPedidos, getFromCache, setToCache]);

  // Debounce para evitar cálculos excessivos
  useEffect(() => {
    const timer = setTimeout(() => {
      carregarQuantidades();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [cacheKey]);

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