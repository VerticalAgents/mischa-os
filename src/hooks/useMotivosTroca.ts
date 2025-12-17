import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MotivoTroca {
  id: number;
  nome: string;
  ativo: boolean;
}

export function useMotivosTroca() {
  const [motivos, setMotivos] = useState<MotivoTroca[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarMotivos();
  }, []);

  const carregarMotivos = async () => {
    try {
      const { data, error } = await supabase
        .from('motivos_troca')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setMotivos(data || []);
    } catch (error) {
      console.error('Erro ao carregar motivos de troca:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarMotivo = async (nome: string) => {
    try {
      const { data, error } = await supabase
        .from('motivos_troca')
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
