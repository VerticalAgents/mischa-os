
import { useConfiguracoesStore } from "./useConfiguracoesStore";
import { useSupabaseProdutos } from "./useSupabaseProdutos";

interface ProporcoesConfig {
  [produtoId: string]: number;
}

interface ProdutoQuantidade {
  produto: string;
  quantidade: number;
}

export const useProporoesPadrao = () => {
  const { obterConfiguracao } = useConfiguracoesStore();
  const { produtos } = useSupabaseProdutos();

  const obterProporcoes = (): ProporcoesConfig => {
    return obterConfiguracao('proporcoes-padrao') || {};
  };

  const calcularQuantidadesPorProporcao = (quantidadeTotal: number): ProdutoQuantidade[] => {
    const proporcoes = obterProporcoes();
    const produtosAtivos = produtos.filter(p => p.ativo);
    
    if (Object.keys(proporcoes).length === 0) {
      return [];
    }

    // Verificar se as proporções somam 100%
    const totalProporcoes = Object.values(proporcoes).reduce((sum, val) => sum + val, 0);
    if (totalProporcoes !== 100) {
      return [];
    }

    // Calcular quantidades usando Math.floor
    const quantidades: { [produtoId: string]: number } = {};
    let totalCalculado = 0;

    // Primeiro passo: calcular com Math.floor
    produtosAtivos.forEach(produto => {
      const proporcao = proporcoes[produto.id] || 0;
      if (proporcao > 0) {
        const quantidade = Math.floor((proporcao / 100) * quantidadeTotal);
        quantidades[produto.id] = quantidade;
        totalCalculado += quantidade;
      }
    });

    // Segundo passo: distribuir o residual para o produto com maior proporção
    const residual = quantidadeTotal - totalCalculado;
    if (residual > 0) {
      // Encontrar o produto com maior proporção
      let maiorProporcao = 0;
      let produtoMaiorProporcao = '';
      
      produtosAtivos.forEach(produto => {
        const proporcao = proporcoes[produto.id] || 0;
        if (proporcao > maiorProporcao) {
          maiorProporcao = proporcao;
          produtoMaiorProporcao = produto.id;
        }
      });

      if (produtoMaiorProporcao) {
        quantidades[produtoMaiorProporcao] += residual;
      }
    }

    // Converter para array de resultado
    return produtosAtivos
      .filter(produto => quantidades[produto.id] > 0)
      .map(produto => ({
        produto: produto.nome,
        quantidade: quantidades[produto.id]
      }));
  };

  const temProporcoesConfiguradas = (): boolean => {
    const proporcoes = obterProporcoes();
    const totalProporcoes = Object.values(proporcoes).reduce((sum, val) => sum + val, 0);
    return totalProporcoes === 100;
  };

  return {
    obterProporcoes,
    calcularQuantidadesPorProporcao,
    temProporcoesConfiguradas
  };
};
