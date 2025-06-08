
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProdutoSupabase {
  id: string;
  nome: string;
  descricao?: string;
  preco_venda?: number;
  peso_unitario?: number;
  unidades_producao: number;
  categoria_id?: number;
  subcategoria_id?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  estoque_ideal?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoSupabase[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarProdutos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('produtos_finais')
        .select('*')
        .eq('ativo', true)
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

      setProdutos((data as ProdutoSupabase[]) || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarProduto = async (produto: Omit<ProdutoSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('produtos_finais')
        .insert([produto])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar produto:', error);
        toast({
          title: "Erro ao adicionar produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setProdutos(prev => [...prev, data as ProdutoSupabase]);
      toast({
        title: "Produto adicionado",
        description: "Produto criado com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      return false;
    }
  };

  const atualizarProduto = async (id: string, produto: Partial<ProdutoSupabase>) => {
    try {
      const { data, error } = await supabase
        .from('produtos_finais')
        .update(produto)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        toast({
          title: "Erro ao atualizar produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setProdutos(prev => prev.map(p => p.id === id ? data as ProdutoSupabase : p));
      toast({
        title: "Produto atualizado",
        description: "Produto atualizado com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      return false;
    }
  };

  const removerProduto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produtos_finais')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover produto:', error);
        toast({
          title: "Erro ao remover produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setProdutos(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Produto removido",
        description: "Produto removido com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover produto:', error);
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
    adicionarProduto,
    atualizarProduto,
    removerProduto
  };
};
