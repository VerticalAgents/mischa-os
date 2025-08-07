
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProdutoSupabase {
  id: string;
  nome: string;
  descricao?: string;
  categoria_id?: number;
  subcategoria_id?: number;
  unidades_producao: number;
  peso_unitario?: number;
  preco_venda?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  estoque_ideal?: number;
  custo_total?: number;
  custo_unitario?: number;
  margem_lucro?: number;
}

export interface ComponenteProduto {
  id: string;
  tipo: 'receita' | 'insumo';
  quantidade: number;
  nome_item?: string;
  custo_item?: number;
}

export interface ProdutoCompleto extends ProdutoSupabase {
  componentes?: ComponenteProduto[];
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoSupabase[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos_finais')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setProdutos(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarProdutoCompleto = async (produtoId: string): Promise<ProdutoCompleto | null> => {
    try {
      const { data: produto, error: produtoError } = await supabase
        .from('produtos_finais')
        .select('*')
        .eq('id', produtoId)
        .single();

      if (produtoError) {
        console.error('Erro ao carregar produto:', produtoError);
        return null;
      }

      // Load components separately with proper error handling
      const { data: componentes, error: componentesError } = await supabase
        .from('componentes_produto')
        .select('id, tipo, quantidade, item_id')
        .eq('produto_id', produtoId);

      if (componentesError) {
        console.error('Erro ao carregar componentes:', componentesError);
      }

      // For now, we'll use a simplified approach for components
      // You may need to implement separate queries to get the names based on tipo and item_id
      const componentesFormatados = componentes?.map(comp => ({
        id: comp.id,
        tipo: comp.tipo as 'receita' | 'insumo',
        quantidade: comp.quantidade,
        nome_item: `Item ${comp.item_id}`, // Simplified - you may want to fetch actual names
        custo_item: 0 // Will be calculated based on actual costs
      })) || [];

      return {
        ...produto,
        componentes: componentesFormatados
      };
    } catch (error) {
      console.error('Erro ao carregar produto completo:', error);
      return null;
    }
  };

  const adicionarProduto = async (dadosProduto: Partial<ProdutoSupabase>) => {
    try {
      // Ensure nome is provided as it's required
      if (!dadosProduto.nome) {
        toast({
          title: "Erro de validação",
          description: "Nome do produto é obrigatório",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('produtos_finais')
        .insert(dadosProduto as any) // Cast to avoid type issues
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar produto:', error);
        toast({
          title: "Erro ao adicionar produto",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Produto adicionado",
        description: "Produto adicionado com sucesso",
      });

      await carregarProdutos();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro ao adicionar produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  const atualizarProduto = async (produtoId: string, dadosAtualizacao: Partial<ProdutoSupabase>) => {
    try {
      const { error } = await supabase
        .from('produtos_finais')
        .update(dadosAtualizacao as any) // Cast to avoid type issues
        .eq('id', produtoId);

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        toast({
          title: "Erro ao atualizar produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

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

  const removerProduto = async (produtoId: string) => {
    try {
      const { error } = await supabase
        .from('produtos_finais')
        .delete()
        .eq('id', produtoId);

      if (error) {
        console.error('Erro ao remover produto:', error);
        toast({
          title: "Erro ao remover produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Produto removido",
        description: "Produto removido com sucesso",
      });

      await carregarProdutos();
      return true;
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      toast({
        title: "Erro ao remover produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const duplicarProduto = async (produto: ProdutoSupabase) => {
    try {
      const novoProduto = {
        nome: `${produto.nome} (Cópia)`,
        descricao: produto.descricao,
        categoria_id: produto.categoria_id,
        subcategoria_id: produto.subcategoria_id,
        unidades_producao: produto.unidades_producao,
        peso_unitario: produto.peso_unitario,
        preco_venda: produto.preco_venda,
        ativo: true,
        estoque_atual: produto.estoque_atual || 0,
        estoque_minimo: produto.estoque_minimo,
        estoque_ideal: produto.estoque_ideal,
        custo_total: produto.custo_total,
        custo_unitario: produto.custo_unitario,
        margem_lucro: produto.margem_lucro
      };

      return await adicionarProduto(novoProduto);
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      toast({
        title: "Erro ao duplicar produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  const adicionarComponenteProduto = async (produtoId: string, itemId: string, tipo: 'receita' | 'insumo', quantidade: number) => {
    try {
      const { error } = await supabase
        .from('componentes_produto')
        .insert({
          produto_id: produtoId,
          item_id: itemId,
          tipo,
          quantidade
        });

      if (error) {
        console.error('Erro ao adicionar componente:', error);
        toast({
          title: "Erro ao adicionar componente",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

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

  useEffect(() => {
    carregarProdutos();
  }, []);

  return {
    produtos,
    loading,
    carregarProdutos,
    carregarProdutoCompleto,
    adicionarProduto,
    atualizarProduto,
    removerProduto,
    duplicarProduto,
    adicionarComponenteProduto,
    removerComponenteProduto
  };
};
