import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MotivoBonificacao {
  id: number;
  nome: string;
  ativo: boolean;
}

export function useMotivosBonificacao() {
  const [motivos, setMotivos] = useState<MotivoBonificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMotivos();
  }, []);

  const carregarMotivos = async () => {
    try {
      const { data, error } = await supabase
        .from('motivos_bonificacao')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setMotivos(data || []);
    } catch (error) {
      console.error('Erro ao carregar motivos de bonificação:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarMotivo = async (nome: string) => {
    try {
      const { data, error } = await supabase
        .from('motivos_bonificacao')
        .insert({ nome })
        .select()
        .single();

      if (error) throw error;
      if (data) setMotivos(prev => [...prev, data]);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar motivo:', error);
      return null;
    }
  };

  return { motivos, loading, carregarMotivos, adicionarMotivo };
}