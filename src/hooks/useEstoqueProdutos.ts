
import { useState, useEffect, useMemo } from 'react';
import { useSupabaseProdutos, ProdutoSupabase } from './useSupabaseProdutos';

export interface ProdutoComEstoque {
  id: string;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
}

export const useEstoqueProdutos = () => {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const [isReady, setIsReady] = useState(false);

  // Aguardar o carregamento completo dos produtos
  useEffect(() => {
    if (!loadingProdutos && produtos.length >= 0) {
      // Pequeno delay para garantir que os dados estão totalmente carregados
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loadingProdutos, produtos]);

  const produtosComEstoque = useMemo((): ProdutoComEstoque[] => {
    if (!isReady) return [];
    
    return produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      estoque_atual: produto.estoque_atual || 0,
      estoque_minimo: produto.estoque_minimo || 0,
      ativo: produto.ativo
    }));
  }, [produtos, isReady]);

  const obterEstoquePorNome = (nomeProduto: string): number => {
    const produto = produtosComEstoque.find(p => 
      p.nome.toLowerCase() === nomeProduto.toLowerCase()
    );
    return produto?.estoque_atual || 0;
  };

  const obterProdutoPorNome = (nomeProduto: string): ProdutoComEstoque | undefined => {
    return produtosComEstoque.find(p => 
      p.nome.toLowerCase() === nomeProduto.toLowerCase()
    );
  };

  return {
    produtos: produtosComEstoque,
    loading: loadingProdutos || !isReady,
    obterEstoquePorNome,
    obterProdutoPorNome,
    recarregar: () => {
      setIsReady(false);
      // O useSupabaseProdutos já tem sua própria função de reload
    }
  };
};
