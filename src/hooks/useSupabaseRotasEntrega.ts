
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RotaEntrega {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseRotasEntrega = () => {
  const [rotasEntrega, setRotasEntrega] = useState<RotaEntrega[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarRotasEntrega = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        setRotasEntrega([]);
        return;
      }

      const { data, error } = await supabase
        .from('rotas_entrega')
        .select('*')
        .eq('ativo', true)
        .eq('user_id', user.id)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar rotas de entrega:', error);
        return;
      }

      setRotasEntrega(data || []);
    } catch (error) {
      console.error('Erro ao carregar rotas de entrega:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarRotaEntrega = async (rota: {
    nome: string;
    descricao?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('rotas_entrega')
        .insert({ ...rota, user_id: user.id })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar rota de entrega",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Rota de entrega criada",
        description: "Rota de entrega criada com sucesso"
      });

      await carregarRotasEntrega();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar rota de entrega:', error);
      return null;
    }
  };

  const atualizarRotaEntrega = async (id: number, updates: Partial<RotaEntrega>) => {
    try {
      const { error } = await supabase
        .from('rotas_entrega')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar rota de entrega",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Rota de entrega atualizada",
        description: "Rota de entrega atualizada com sucesso"
      });

      await carregarRotasEntrega();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar rota de entrega:', error);
      return false;
    }
  };

  const removerRotaEntrega = async (id: number) => {
    try {
      const { error } = await supabase
        .from('rotas_entrega')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover rota de entrega",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Rota de entrega removida",
        description: "Rota de entrega removida com sucesso"
      });

      await carregarRotasEntrega();
      return true;
    } catch (error) {
      console.error('Erro ao remover rota de entrega:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarRotasEntrega();
  }, []);

  return {
    rotasEntrega,
    loading,
    carregarRotasEntrega,
    adicionarRotaEntrega,
    atualizarRotaEntrega,
    removerRotaEntrega,
  };
};
