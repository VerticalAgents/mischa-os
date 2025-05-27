
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { InsumoSupabase } from './useSupabaseInsumos';

export interface ReceitaBaseSupabase {
  id: string;
  nome: string;
  descricao?: string;
  rendimento: number;
  unidade_rendimento: string;
  created_at: string;
  updated_at: string;
}

export interface ItemReceitaSupabase {
  id: string;
  receita_id: string;
  insumo_id: string;
  quantidade: number;
  created_at: string;
}

export interface ReceitaCompleta extends ReceitaBaseSupabase {
  itens: (ItemReceitaSupabase & { 
    insumo: InsumoSupabase;
    custo_item: number;
  })[];
  peso_total: number;
  custo_total: number;
  custo_unitario: number;
}

export const useSupabaseReceitas = () => {
  const [receitas, setReceitas] = useState<ReceitaCompleta[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarReceitas = async () => {
    setLoading(true);
    try {
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas_base' as any)
        .select('*')
        .order('nome');

      if (receitasError) {
        console.error('Erro ao carregar receitas:', receitasError);
        toast({
          title: "Erro ao carregar receitas",
          description: receitasError.message,
          variant: "destructive"
        });
        return;
      }

      const receitasCompletas: ReceitaCompleta[] = [];

      for (const receita of receitasData || []) {
        const { data: itensData, error: itensError } = await supabase
          .from('itens_receita' as any)
          .select(`
            *,
            insumos (*)
          `)
          .eq('receita_id', receita.id);

        if (itensError) {
          console.error('Erro ao carregar itens da receita:', itensError);
          continue;
        }

        const itensCompletos = (itensData || []).map((item: any) => {
          const insumo = item.insumos as InsumoSupabase;
          const custoUnitario = insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
          return {
            ...item,
            insumo,
            custo_item: item.quantidade * custoUnitario
          };
        });

        const peso_total = itensCompletos.reduce((sum, item) => sum + item.quantidade, 0);
        const custo_total = itensCompletos.reduce((sum, item) => sum + item.custo_item, 0);
        const custo_unitario = receita.rendimento > 0 ? custo_total / receita.rendimento : 0;

        receitasCompletas.push({
          ...receita,
          itens: itensCompletos,
          peso_total,
          custo_total,
          custo_unitario
        });
      }

      setReceitas(receitasCompletas);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarReceita = async (receita: Omit<ReceitaBaseSupabase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('receitas_base' as any)
        .insert([receita])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar receita:', error);
        toast({
          title: "Erro ao adicionar receita",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Receita adicionada",
        description: "Receita criada com sucesso"
      });
      await carregarReceitas();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar receita:', error);
      return null;
    }
  };

  const adicionarItemReceita = async (receita_id: string, insumo_id: string, quantidade: number) => {
    try {
      const { error } = await supabase
        .from('itens_receita' as any)
        .insert([{ receita_id, insumo_id, quantidade }]);

      if (error) {
        console.error('Erro ao adicionar item à receita:', error);
        toast({
          title: "Erro ao adicionar item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      await carregarReceitas();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar item à receita:', error);
      return false;
    }
  };

  const removerItemReceita = async (item_id: string) => {
    try {
      const { error } = await supabase
        .from('itens_receita' as any)
        .delete()
        .eq('id', item_id);

      if (error) {
        console.error('Erro ao remover item da receita:', error);
        toast({
          title: "Erro ao remover item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      await carregarReceitas();
      return true;
    } catch (error) {
      console.error('Erro ao remover item da receita:', error);
      return false;
    }
  };

  const removerReceita = async (id: string) => {
    try {
      const { error } = await supabase
        .from('receitas_base' as any)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover receita:', error);
        toast({
          title: "Erro ao remover receita",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setReceitas(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Receita removida",
        description: "Receita removida com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover receita:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarReceitas();
  }, []);

  return {
    receitas,
    loading,
    carregarReceitas,
    adicionarReceita,
    adicionarItemReceita,
    removerItemReceita,
    removerReceita
  };
};
