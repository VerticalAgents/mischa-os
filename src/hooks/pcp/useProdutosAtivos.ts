
import { useMemo } from 'react';
import { useSupabaseProdutos } from '../useSupabaseProdutos';
import { useSupabaseCategoriasProduto } from '../useSupabaseCategoriasProduto';
import { ProdutoComCategoria } from './types';

export const useProdutosAtivos = () => {
  const { produtos } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();

  const produtosAtivosComCategoria = useMemo(() => {
    return produtos
      .filter(produto => produto.ativo)
      .map(produto => {
        const categoria = categorias.find(cat => cat.id === produto.categoria_id);
        return {
          nome: produto.nome,
          categoria: categoria?.nome || "Sem categoria",
          categoriaId: produto.categoria_id || 0
        };
      })
      .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nome.localeCompare(b.nome));
  }, [produtos, categorias]);

  return { produtosAtivosComCategoria };
};
