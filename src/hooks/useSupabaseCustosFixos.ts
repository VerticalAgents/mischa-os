
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustoFixo {
  id: string;
  nome: string;
  subcategoria: string;
  valor: number;
  frequencia: 'mensal' | 'semanal' | 'trimestral' | 'semestral' | 'anual';
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
}

export function useSupabaseCustosFixos() {
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchCustosFixos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custos_fixos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustosFixos(data || []);
    } catch (error) {
      console.error('Erro ao carregar custos fixos:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar custos fixos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const adicionarCustoFixo = async (custo: Omit<CustoFixo, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('custos_fixos')
        .insert([custo])
        .select()
        .single();

      if (error) throw error;
      setCustosFixos(prev => [data, ...prev]);
      toast({
        title: "Sucesso",
        description: "Custo fixo adicionado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Erro ao adicionar custo fixo:', error);
      toast({
        title: "Erro",
        description: "Erro ao adicionar custo fixo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const atualizarCustoFixo = async (id: string, custo: Partial<CustoFixo>) => {
    try {
      const { data, error } = await supabase
        .from('custos_fixos')
        .update(custo)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setCustosFixos(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: "Sucesso",
        description: "Custo fixo atualizado com sucesso",
      });
      return data;
    } catch (error) {
      console.error('Erro ao atualizar custo fixo:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar custo fixo",
        variant: "destructive",
      });
      throw error;
    }
  };

  const excluirCustoFixo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custos_fixos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setCustosFixos(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Sucesso",
        description: "Custo fixo excluído com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir custo fixo:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir custo fixo",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCustosFixos();
  }, []);

  return {
    custosFixos,
    isLoading,
    adicionarCustoFixo,
    atualizarCustoFixo,
    excluirCustoFixo,
    recarregarCustosFixos: fetchCustosFixos,
  };
}
