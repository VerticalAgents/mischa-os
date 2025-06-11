
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

  const calcularQuantidadesPorProporcao = async (quantidadeTotal: number): Promise<ProdutoQuantidade[]> => {
    const resultados = await obterProporcoesParaPedido(quantidadeTotal);
    return resultados.map(item => ({
      produto: item.produto_nome,
      quantidade: item.quantidade
    }));
  };

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
