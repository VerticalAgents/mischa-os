
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  unidades_por_forma?: number;
  preco_venda?: number;
  custo_total?: number;
  margem_lucro?: number;
  ativo?: boolean;
  peso_unitario?: number;
  custo_unitario?: number;
  unidades_producao?: number;
  estoque_minimo?: number;
  categoria_id?: number;
  subcategoria_id?: number;
  created_at?: string;
  updated_at?: string;
}

export const useProdutosSupabase = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addProduto = async (produto: Omit<Produto, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .insert([produto])
        .select()
        .single();

      if (error) throw error;
      setProdutos(prev => [...prev, data]);
      toast.success('Produto adicionado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao adicionar produto: ' + error.message);
      throw error;
    }
  };

  const updateProduto = async (id: string, updates: Partial<Produto>) => {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setProdutos(prev => prev.map(p => p.id === id ? data : p));
      toast.success('Produto atualizado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao atualizar produto: ' + error.message);
      throw error;
    }
  };

  const deleteProduto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produtos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast.success('Produto removido com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao remover produto: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  return {
    produtos,
    loading,
    addProduto,
    updateProduto,
    deleteProduto,
    refetch: fetchProdutos
  };
};
