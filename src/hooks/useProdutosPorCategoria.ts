
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useClientesCategorias } from './useClientesCategorias';

interface ProdutoFiltrado {
  id: string;
  nome: string;
  categoriaId: number;
}

export const useProdutosPorCategoria = (clienteId?: string) => {
  const [produtosFiltrados, setProdutosFiltrados] = useState<ProdutoFiltrado[]>([]);
  const [categoriasCliente, setCategoriasCliente] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { produtos } = useSupabaseProdutos();
  const { carregarCategoriasCliente } = useClientesCategorias();

  const carregarDados = useCallback(async () => {
    if (!clienteId) {
      setProdutosFiltrados([]);
      setCategoriasCliente([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Carregando categorias para cliente:', clienteId);
      const categorias = await carregarCategoriasCliente(clienteId);
      console.log('✅ Categorias carregadas:', categorias);
      
      setCategoriasCliente(categorias);

      if (categorias.length > 0 && produtos.length > 0) {
        const produtosFiltrados = produtos
          .filter(produto => produto.ativo && categorias.includes(produto.categoria_id || 0))
          .map(produto => ({
            id: produto.id,
            nome: produto.nome,
            categoriaId: produto.categoria_id || 0
          }));
        
        console.log('📦 Produtos filtrados:', produtosFiltrados);
        setProdutosFiltrados(produtosFiltrados);
      } else {
        setProdutosFiltrados([]);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err);
      setError('Erro ao carregar produtos');
      setProdutosFiltrados([]);
      setCategoriasCliente([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, carregarCategoriasCliente]);

  // Efeito separado para reagir a mudanças nos produtos
  useEffect(() => {
    if (clienteId && categoriasCliente.length > 0 && produtos.length > 0) {
      const produtosFiltrados = produtos
        .filter(produto => produto.ativo && categoriasCliente.includes(produto.categoria_id || 0))
        .map(produto => ({
          id: produto.id,
          nome: produto.nome,
          categoriaId: produto.categoria_id || 0
        }));
      
      console.log('📦 Produtos atualizados:', produtosFiltrados);
      setProdutosFiltrados(produtosFiltrados);
    }
  }, [produtos, categoriasCliente, clienteId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return {
    produtosFiltrados,
    categoriasCliente,
    loading,
    error,
    recarregar: carregarDados
  };
};
