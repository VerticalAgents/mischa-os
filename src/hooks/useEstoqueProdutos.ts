
import { useState, useEffect, useMemo } from 'react';
import { useSupabaseProdutos, ProdutoSupabase } from './useSupabaseProdutos';
import { useEstoqueReservado } from './useEstoqueReservado';

export interface ProdutoComEstoque {
  id: string;
  nome: string;
  estoque_atual: number;
  estoque_disponivel: number;
  estoque_reservado: number;
  estoque_minimo: number;
  ativo: boolean;
}

export const useEstoqueProdutos = () => {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { quantidadesReservadas, loading: loadingReservados } = useEstoqueReservado();
  const [isReady, setIsReady] = useState(false);

  // Aguardar o carregamento completo dos produtos e quantidades reservadas
  useEffect(() => {
    if (!loadingProdutos && !loadingReservados && produtos.length >= 0) {
      // Pequeno delay para garantir que os dados estão totalmente carregados
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loadingProdutos, loadingReservados, produtos]);

  const produtosComEstoque = useMemo((): ProdutoComEstoque[] => {
    if (!isReady) return [];
    
    return produtos.map(produto => {
      const estoqueAtual = produto.estoque_atual || 0;
      const estoqueReservado = quantidadesReservadas[produto.nome] || 0;
      const estoqueDisponivel = Math.max(0, estoqueAtual - estoqueReservado);
      
      return {
        id: produto.id,
        nome: produto.nome,
        estoque_atual: estoqueAtual,
        estoque_disponivel: estoqueDisponivel,
        estoque_reservado: estoqueReservado,
        estoque_minimo: produto.estoque_minimo || 0,
        ativo: produto.ativo
      };
    });
  }, [produtos, quantidadesReservadas, isReady]);

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
    loading: loadingProdutos || loadingReservados || !isReady,
    obterEstoquePorNome,
    obterEstoqueDisponivel,
    obterProdutoPorNome,
    recarregar: () => {
      setIsReady(false);
      // O useSupabaseProdutos já tem sua própria função de reload
    }
  };
};
