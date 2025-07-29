
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Representante {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseRepresentantes = () => {
  const [representantes, setRepresentantes] = useState<Representante[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarRepresentantes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando representantes...');
      
      const { data, error } = await supabase
        .from('representantes')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar representantes:', error);
        toast({
          title: "Erro ao carregar representantes",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Representantes carregados:', data?.length || 0);
      setRepresentantes(data || []);
    } catch (error) {
      console.error('Erro ao carregar representantes:', error);
      toast({
        title: "Erro ao carregar representantes",
        description: "Erro inesperado ao carregar representantes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarRepresentante = async (representante: {
    nome: string;
    email?: string;
    telefone?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('representantes')
        .insert(representante)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar representante",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Representante criado",
        description: "Representante criado com sucesso"
      });

      await carregarRepresentantes();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar representante:', error);
      return null;
    }
  };

  const atualizarRepresentante = async (id: number, updates: Partial<Representante>) => {
    try {
      const { error } = await supabase
        .from('representantes')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar representante",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Representante atualizado",
        description: "Representante atualizado com sucesso"
      });

      await carregarRepresentantes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar representante:', error);
      return false;
    }
  };

  const removerRepresentante = async (id: number) => {
    try {
      const { error } = await supabase
        .from('representantes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover representante",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Representante removido",
        description: "Representante removido com sucesso"
      });

      await carregarRepresentantes();
      return true;
    } catch (error) {
      console.error('Erro ao remover representante:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarRepresentantes();
  }, []);

  return {
    representantes,
    loading,
    carregarRepresentantes,
    adicionarRepresentante,
    atualizarRepresentante,
    removerRepresentante,
  };
};
