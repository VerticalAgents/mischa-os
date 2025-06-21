
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustoVariavel {
  id: string;
  nome: string;
  subcategoria: string;
  valor: number;
  frequencia: 'mensal' | 'semanal' | 'trimestral' | 'semestral' | 'anual' | 'por-producao';
  percentual_faturamento: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseCustosVariaveis() {
  const [custosVariaveis, setCustosVariaveis] = useState<CustoVariavel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustosVariaveis = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custos_variaveis')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustosVariaveis((data || []) as CustoVariavel[]);
    } catch (error) {
      console.error('Erro ao carregar custos variáveis:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar custos variáveis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarCustoVariavel = async (custo: Omit<CustoVariavel, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('custos_variaveis')
        .insert([custo])
        .select()
        .single();

      if (error) throw error;
      setCustosVariaveis(prev => [data as CustoVariavel, ...prev]);
      toast({
        title: "Sucesso",
        description: "Custo variável adicionado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Erro ao adicionar custo variável:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar custo variável",
        variant: "destructive",
      });
      throw error;
    }
  };

  const atualizarCustoVariavel = async (id: string, custo: Partial<CustoVariavel>) => {
    try {
      const { data, error } = await supabase
        .from('custos_variaveis')
        .update(custo)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCustosVariaveis(prev => prev.map(c => c.id === id ? data as CustoVariavel : c));
      toast({
        title: "Sucesso",
        description: "Custo variável atualizado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Erro ao atualizar custo variável:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo variável",
        variant: "destructive",
      });
      throw error;
    }
  };

  const excluirCustoVariavel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custos_variaveis')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustosVariaveis(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Custo variável excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir custo variável:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir custo variável",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCustosVariaveis();
  }, []);

  return {
    custosVariaveis,
    isLoading,
    adicionarCustoVariavel,
    atualizarCustoVariavel,
    excluirCustoVariavel,
    recarregarCustosVariaveis: fetchCustosVariaveis,
  };
}
