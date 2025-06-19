
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface TipoCobranca {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseTiposCobranca = () => {
  const [tiposCobranca, setTiposCobranca] = useState<TipoCobranca[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarTiposCobranca = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tipos_cobranca')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar tipos de cobrança:', error);
        return;
      }

      setTiposCobranca(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de cobrança:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarTipoCobranca = async (tipo: {
    nome: string;
    descricao?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('tipos_cobranca')
        .insert(tipo)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar tipo de cobrança",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Tipo de cobrança criado",
        description: "Tipo de cobrança criado com sucesso"
      });

      await carregarTiposCobranca();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar tipo de cobrança:', error);
      return null;
    }
  };

  const atualizarTipoCobranca = async (id: number, updates: Partial<TipoCobranca>) => {
    try {
      const { error } = await supabase
        .from('tipos_cobranca')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar tipo de cobrança",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tipo de cobrança atualizado",
        description: "Tipo de cobrança atualizado com sucesso"
      });

      await carregarTiposCobranca();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar tipo de cobrança:', error);
      return false;
    }
  };

  const removerTipoCobranca = async (id: number) => {
    try {
      const { error } = await supabase
        .from('tipos_cobranca')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover tipo de cobrança",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Tipo de cobrança removido",
        description: "Tipo de cobrança removido com sucesso"
      });

      await carregarTiposCobranca();
      return true;
    } catch (error) {
      console.error('Erro ao remover tipo de cobrança:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarTiposCobranca();
  }, []);

  return {
    tiposCobranca,
    loading,
    carregarTiposCobranca,
    adicionarTipoCobranca,
    atualizarTipoCobranca,
    removerTipoCobranca,
  };
};
