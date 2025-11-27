
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FormaPagamento {
  id: number;
  nome: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseFormasPagamento = () => {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarFormasPagamento = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Usuário não autenticado');
        setFormasPagamento([]);
        return;
      }

      const { data, error } = await supabase
        .from('formas_pagamento')
        .select('*')
        .eq('ativo', true)
        .eq('user_id', user.id)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar formas de pagamento:', error);
        return;
      }

      setFormasPagamento(data || []);
    } catch (error) {
      console.error('Erro ao carregar formas de pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarFormaPagamento = async (forma: {
    nome: string;
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
        .from('formas_pagamento')
        .insert({ ...forma, user_id: user.id })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar forma de pagamento",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Forma de pagamento criada",
        description: "Forma de pagamento criada com sucesso"
      });

      await carregarFormasPagamento();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar forma de pagamento:', error);
      return null;
    }
  };

  const atualizarFormaPagamento = async (id: number, updates: Partial<FormaPagamento>) => {
    try {
      const { error } = await supabase
        .from('formas_pagamento')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar forma de pagamento",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Forma de pagamento atualizada",
        description: "Forma de pagamento atualizada com sucesso"
      });

      await carregarFormasPagamento();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar forma de pagamento:', error);
      return false;
    }
  };

  const removerFormaPagamento = async (id: number) => {
    try {
      const { error } = await supabase
        .from('formas_pagamento')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover forma de pagamento",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Forma de pagamento removida",
        description: "Forma de pagamento removida com sucesso"
      });

      await carregarFormasPagamento();
      return true;
    } catch (error) {
      console.error('Erro ao remover forma de pagamento:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarFormasPagamento();
  }, []);

  return {
    formasPagamento,
    loading,
    carregarFormasPagamento,
    adicionarFormaPagamento,
    atualizarFormaPagamento,
    removerFormaPagamento,
  };
};
