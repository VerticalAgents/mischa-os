
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Sabor {
  id: string;
  nome: string;
  percentual_padrao_dist?: number;
  ativo?: boolean;
  estoque_minimo?: number;
  saldo_atual?: number;
  custo_unitario?: number;
  preco_venda?: number;
  estoque_ideal?: number;
  em_producao?: number;
  created_at?: string;
  updated_at?: string;
}

export const useSaboresSupabase = () => {
  const [sabores, setSabores] = useState<Sabor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSabores = async () => {
    try {
      const { data, error } = await supabase
        .from('sabores')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setSabores(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar sabores: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addSabor = async (sabor: Omit<Sabor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('sabores')
        .insert([sabor])
        .select()
        .single();

      if (error) throw error;
      setSabores(prev => [...prev, data]);
      toast.success('Sabor adicionado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao adicionar sabor: ' + error.message);
      throw error;
    }
  };

  const updateSabor = async (id: string, updates: Partial<Sabor>) => {
    try {
      const { data, error } = await supabase
        .from('sabores')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setSabores(prev => prev.map(s => s.id === id ? data : s));
      toast.success('Sabor atualizado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao atualizar sabor: ' + error.message);
      throw error;
    }
  };

  const deleteSabor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sabores')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
      setSabores(prev => prev.filter(s => s.id !== id));
      toast.success('Sabor removido com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao remover sabor: ' + error.message);
      throw error;
    }
  };

  useEffect(() => {
    fetchSabores();
  }, []);

  return {
    sabores,
    loading,
    addSabor,
    updateSabor,
    deleteSabor,
    refetch: fetchSabores
  };
};
