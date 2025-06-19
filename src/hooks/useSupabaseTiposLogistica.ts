
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TipoLogistica {
  id: number;
  nome: string;
  percentual_logistico: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseTiposLogistica = () => {
  const [tiposLogistica, setTiposLogistica] = useState<TipoLogistica[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarTiposLogistica = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipos_logistica')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar tipos de logística:', error);
        return;
      }

      setTiposLogistica(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de logística:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarTipoLogistica = async (tipo: {
    nome: string;
    percentual_logistico?: number;
  }) => {
    try {
      const { data, error } = await supabase
        .from('tipos_logistica')
        .insert(tipo)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar tipo de logística",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Tipo de logística criado",
        description: "Tipo de logística criado com sucesso"
      });

      await carregarTiposLogistica();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar tipo de logística:', error);
      return null;
    }
  };

  const atualizarTipoLogistica = async (id: number, updates: Partial<TipoLogistica>) => {
    try {
      const { error } = await supabase
        .from('tipos_logistica')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar tipo de logística",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tipo de logística atualizado",
        description: "Tipo de logística atualizado com sucesso"
      });

      await carregarTiposLogistica();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tipo de logística:', error);
      return false;
    }
  };

  const removerTipoLogistica = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tipos_logistica')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover tipo de logística",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tipo de logística removido",
        description: "Tipo de logística removido com sucesso"
      });

      await carregarTiposLogistica();
      return true;
    } catch (error) {
      console.error('Erro ao remover tipo de logística:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarTiposLogistica();
  }, []);

  return {
    tiposLogistica,
    loading,
    carregarTiposLogistica,
    adicionarTipoLogistica,
    atualizarTipoLogistica,
    removerTipoLogistica,
  };
};
