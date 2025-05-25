
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HistoricoProducao {
  id: string;
  data_producao: string;
  produto_id?: string;
  produto_nome: string;
  formas_producidas: number;
  unidades_calculadas: number;
  turno?: string;
  observacoes?: string;
  origem?: string;
  created_at?: string;
  updated_at?: string;
}

export const useHistoricoProducaoSupabase = () => {
  const [historico, setHistorico] = useState<HistoricoProducao[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorico = async () => {
    try {
      const { data, error } = await supabase
        .from('historico_producao')
        .select('*')
        .order('data_producao', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar histórico: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addRegistroHistorico = async (registro: Omit<HistoricoProducao, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('historico_producao')
        .insert([registro])
        .select()
        .single();

      if (error) throw error;
      setHistorico(prev => [data, ...prev]);
      toast.success('Registro de produção adicionado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao adicionar registro: ' + error.message);
      throw error;
    }
  };

  const updateRegistroHistorico = async (id: string, updates: Partial<HistoricoProducao>) => {
    try {
      const { data, error } = await supabase
        .from('historico_producao')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setHistorico(prev => prev.map(h => h.id === id ? data : h));
      toast.success('Registro atualizado com sucesso!');
      return data;
    } catch (error: any) {
      toast.error('Erro ao atualizar registro: ' + error.message);
      throw error;
    }
  };

  const obterHistoricoPorPeriodo = (dataInicio: Date, dataFim: Date) => {
    return historico.filter(h => {
      const dataProducao = new Date(h.data_producao);
      return dataProducao >= dataInicio && dataProducao <= dataFim;
    });
  };

  const obterHistoricoPorProduto = (produtoNome: string) => {
    return historico.filter(h =>
      h.produto_nome.toLowerCase().includes(produtoNome.toLowerCase())
    );
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  return {
    historico,
    loading,
    addRegistroHistorico,
    updateRegistroHistorico,
    obterHistoricoPorPeriodo,
    obterHistoricoPorProduto,
    refetch: fetchHistorico
  };
};
