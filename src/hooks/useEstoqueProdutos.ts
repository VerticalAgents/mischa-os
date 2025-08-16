
import { useState, useEffect, useMemo } from 'react';
import { useSupabaseProdutos, ProdutoSupabase } from './useSupabaseProdutos';
import { useEstoqueReservado } from './useEstoqueReservado';

export interface ProdutoComEstoque {
  id: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
  estoque_disponivel?: number; // Estoque atual menos o reservado
}

export const useEstoqueProdutos = () => {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { obterQuantidadeReservada, isLoading: loadingReservado } = useEstoqueReservado();
  const [isReady, setIsReady] = useState(false);

  // Aguardar o carregamento completo dos produtos e estoque reservado
  useEffect(() => {
    if (!loadingProdutos && !loadingReservado && produtos.length >= 0) {
      // Pequeno delay para garantir que os dados estão totalmente carregados
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loadingProdutos, loadingReservado, produtos]);

  const produtosComEstoque = useMemo((): ProdutoComEstoque[] => {
    if (!isReady) return [];
    
    return produtos.map(produto => {
      const estoqueAtual = produto.estoque_atual || 0;
      const quantidadeReservada = obterQuantidadeReservada(produto.nome);
      const estoqueDisponivel = Math.max(0, estoqueAtual - quantidadeReservada);

      return {
        id: produto.id,
        nome: produto.nome,
        estoque_atual: estoqueAtual,
        estoque_minimo: produto.estoque_minimo || 0,
        ativo: produto.ativo,
        estoque_disponivel: estoqueDisponivel
      };
    });
  }, [produtos, isReady, obterQuantidadeReservada]);

  const obterEstoquePorNome = (nomeProduto: string): number => {
    const produto = produtosComEstoque.find(p => 
      p.nome.toLowerCase() === nomeProduto.toLowerCase()
    );
    return produto?.estoque_atual || 0;
  };

  const obterEstoqueDisponivel = (nomeProduto: string): number => {
    const produto = produtosComEstoque.find(p => 
      p.nome.toLowerCase() === nomeProduto.toLowerCase()
    );
    return produto?.estoque_disponivel || 0;
  };

  const obterProdutoPorNome = (nomeProduto: string): ProdutoComEstoque | undefined => {
    return produtosComEstoque.find(p => 
      p.nome.toLowerCase() === nomeProduto.toLowerCase()
    );
  };

  return {
    produtos: produtosComEstoque,
    loading: loadingProdutos || loadingReservado || !isReady,
    obterEstoquePorNome,
    obterEstoqueDisponivel,
    obterProdutoPorNome,
    recarregar: () => {
      setIsReady(false);
      // O useSupabaseProdutos já tem sua própria função de reload
    }
  };
};
