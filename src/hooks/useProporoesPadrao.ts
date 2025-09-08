
import { useCallback, useMemo } from 'react';
import { useSupabaseProporoesPadrao } from "./useSupabaseProporoesPadrao";

interface ProporcoesConfig {
  [produtoId: string]: number;
}

interface ProdutoQuantidade {
  produto: string;
  quantidade: number;
}

export const useProporoesPadrao = () => {
  const { proporcoes, obterProporcoesParaPedido } = useSupabaseProporoesPadrao();

  const obterProporcoes = (): ProporcoesConfig => {
    const config: ProporcoesConfig = {};
    proporcoes.forEach(proporcao => {
      config[proporcao.produto_id] = proporcao.percentual;
    });
    return config;
  };

  // Cache local para reduzir chamadas ao Supabase
  const cacheLocal = useMemo(() => new Map<number, ProdutoQuantidade[]>(), []);
  
  const calcularQuantidadesPorProporcao = useCallback(async (quantidadeTotal: number): Promise<ProdutoQuantidade[]> => {
    // Verificar cache local primeiro
    if (cacheLocal.has(quantidadeTotal)) {
      return cacheLocal.get(quantidadeTotal)!;
    }
    
    try {
      const resultados = await obterProporcoesParaPedido(quantidadeTotal);
      const produtosQuantidade = resultados.map(item => ({
        produto: item.produto_nome,
        quantidade: item.quantidade
      }));
      
      // Armazenar no cache com limite de 10 entradas
      if (cacheLocal.size >= 10) {
        const firstKey = cacheLocal.keys().next().value;
        cacheLocal.delete(firstKey);
      }
      cacheLocal.set(quantidadeTotal, produtosQuantidade);
      
      return produtosQuantidade;
    } catch (error) {
      console.warn('Erro ao calcular proporções:', error);
      return [];
    }
  }, [obterProporcoesParaPedido, cacheLocal]);

  const temProporcoesConfiguradas = (): boolean => {
    const totalProporcoes = proporcoes.reduce((sum, p) => sum + p.percentual, 0);
    return Math.abs(totalProporcoes - 100) < 0.01;
  };

  return {
    obterProporcoes,
    calcularQuantidadesPorProporcao,
    temProporcoesConfiguradas
  };
};
