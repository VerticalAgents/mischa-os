
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface InsumoSupabase {
  id: string;
  nome: string;
  categoria: 'Matéria Prima' | 'Embalagem' | 'Outros';
  volume_bruto: number;
  unidade_medida: 'g' | 'kg' | 'ml' | 'l' | 'un' | 'pct';
  custo_medio: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  created_at: string;
  updated_at: string;
}

export const useSupabaseInsumos = () => {
  const [insumos, setInsumos] = useState<InsumoSupabase[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarInsumos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('insumos' as any)
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar insumos:', error);
        toast({
          title: "Erro ao carregar insumos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setInsumos((data as any as InsumoSupabase[]) || []);
    } catch (error) {
      console.error('Erro ao carregar insumos:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarInsumo = async (insumo: Omit<InsumoSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('insumos' as any)
        .insert([insumo])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar insumo:', error);
        toast({
          title: "Erro ao adicionar insumo",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setInsumos(prev => [...prev, data as any as InsumoSupabase]);
      toast({
        title: "Insumo adicionado",
        description: "Insumo criado com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao adicionar insumo:', error);
      return false;
    }
  };

  const atualizarInsumo = async (id: string, insumo: Partial<InsumoSupabase>) => {
    try {
      const { data, error } = await supabase
        .from('insumos' as any)
        .update(insumo)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar insumo:', error);
        toast({
          title: "Erro ao atualizar insumo",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setInsumos(prev => prev.map(i => i.id === id ? data as any as InsumoSupabase : i));
      toast({
        title: "Insumo atualizado",
        description: "Insumo atualizado com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar insumo:', error);
      return false;
    }
  };

  const removerInsumo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('insumos' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover insumo:', error);
        toast({
          title: "Erro ao remover insumo",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setInsumos(prev => prev.filter(i => i.id !== id));
      toast({
        title: "Insumo removido",
        description: "Insumo removido com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover insumo:', error);
      return false;
    }
  };

  const calcularCustoUnitario = (insumo: InsumoSupabase) => {
    return insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
  };

  useEffect(() => {
    carregarInsumos();
  }, []);

  return {
    insumos,
    loading,
    carregarInsumos,
    adicionarInsumo,
    atualizarInsumo,
    removerInsumo,
    calcularCustoUnitario
  };
};
