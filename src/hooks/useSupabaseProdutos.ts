
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Produto {
  id: string;
  nome: string;
  categoria_id?: number;
  descricao?: string;
  unidades_producao: number;
  custo_unitario: number;
  preco_venda?: number;
  margem_lucro: number;
  ativo: boolean;
  estoque_atual?: number;
  estoque_minimo?: number;
  peso_unitario?: number;
  custo_total?: number;
  subcategoria_id?: number;
}

export interface ProdutoCompleto extends Produto {
  componentes: {
    id: string;
    tipo: 'receita' | 'insumo';
    nome_item: string;
    quantidade: number;
    custo_item: number;
  }[];
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        return;
      }

      const produtosFormatados = data?.map(produto => ({
        ...produto,
        custo_unitario: Number(produto.custo_unitario || 0),
        preco_venda: produto.preco_venda ? Number(produto.preco_venda) : undefined,
        margem_lucro: Number(produto.margem_lucro || 0),
        unidades_producao: produto.unidades_producao || 1,
        peso_unitario: produto.peso_unitario ? Number(produto.peso_unitario) : undefined,
        custo_total: produto.custo_total ? Number(produto.custo_total) : undefined,
        subcategoria_id: produto.subcategoria_id || undefined,
      })) || [];

      setProdutos(produtosFormatados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarProduto = async (dadosProduto: Partial<Produto>) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .insert(dadosProduto)
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar produto:', error);
        toast({
          title: "Erro ao criar produto",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Produto criado",
        description: "Produto criado com sucesso"
      });

      await carregarProdutos();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro ao criar produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarProduto = async (id: string, dadosAtualizados: Partial<Produto>) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update(dadosAtualizados)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        toast({
          title: "Erro ao atualizar produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso"
      });

      await carregarProdutos();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro ao atualizar produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const adicionarComponenteProduto = async (
    produtoId: string,
    itemId: string,
    tipo: 'receita' | 'insumo',
    quantidade: number
  ) => {
    try {
      const { error } = await supabase
        .from('componentes_produto')
        .insert([{
          produto_id: produtoId,
          item_id: itemId,
          tipo,
          quantidade
        }]);

      if (error) {
        console.error('Erro ao adicionar componente:', error);
        toast({
          title: "Erro ao adicionar componente",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Componente adicionado",
        description: "Componente adicionado com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Erro ao adicionar componente:', error);
      toast({
        title: "Erro ao adicionar componente",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerComponenteProduto = async (componenteId: string) => {
    try {
      const { error } = await supabase
        .from('componentes_produto')
        .delete()
        .eq('id', componenteId);

      if (error) {
        console.error('Erro ao remover componente:', error);
        toast({
          title: "Erro ao remover componente",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Componente removido",
        description: "Componente removido com sucesso"
      });

      return true;
    } catch (error) {
      console.error('Erro ao remover componente:', error);
      toast({
        title: "Erro ao remover componente",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerProduto = async (produtoId: string) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .delete()
        .eq('id', produtoId);

      if (error) {
        console.error('Erro ao remover produto:', error);
        throw error;
      }

      await carregarProdutos();
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      throw error;
    }
  };

  const duplicarProduto = async (produto: Produto) => {
    try {
      // Primeiro, vamos buscar os componentes do produto original
      const { data: componentes, error: componentesError } = await supabase
        .from('componentes_produto')
        .select('*')
        .eq('produto_id', produto.id);

      if (componentesError) {
        console.error('Erro ao buscar componentes:', componentesError);
        throw componentesError;
      }

      // Criar o produto duplicado
      const produtoDuplicado = {
        nome: `${produto.nome} (Cópia)`,
        categoria_id: produto.categoria_id,
        descricao: produto.descricao,
        unidades_producao: produto.unidades_producao,
        custo_unitario: produto.custo_unitario,
        preco_venda: produto.preco_venda,
        margem_lucro: produto.margem_lucro,
        ativo: true, // Sempre ativo por padrão
        estoque_minimo: produto.estoque_minimo || 0,
        peso_unitario: produto.peso_unitario,
        custo_total: produto.custo_total,
        subcategoria_id: produto.subcategoria_id,
      };

      const { data: novoProduto, error: produtoError } = await supabase
        .from('produtos')
        .insert(produtoDuplicado)
        .select()
        .single();

      if (produtoError) {
        console.error('Erro ao duplicar produto:', produtoError);
        throw produtoError;
      }

      // Duplicar os componentes se existirem
      if (componentes && componentes.length > 0) {
        const componentesDuplicados = componentes.map(componente => ({
          produto_id: novoProduto.id,
          item_id: componente.item_id,
          quantidade: componente.quantidade,
          tipo: componente.tipo,
        }));

        const { error: componentesInsertError } = await supabase
          .from('componentes_produto')
          .insert(componentesDuplicados);

        if (componentesInsertError) {
          console.error('Erro ao duplicar componentes:', componentesInsertError);
          // Não falhar a operação por causa dos componentes
        }
      }

      return novoProduto;
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      throw error;
    }
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  return {
    produtos,
    loading,
    carregarProdutos,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    duplicarProduto,
    adicionarComponenteProduto,
    removerComponenteProduto,
  };
};
