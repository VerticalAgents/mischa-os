import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CartaoCredito } from '@/types/parcelamentos';
import { toast } from 'sonner';

export function useCartoes() {
  const queryClient = useQueryClient();

  const { data: cartoes = [], isLoading } = useQuery({
    queryKey: ['cartoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as CartaoCredito[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (cartao: Omit<CartaoCredito, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('cartoes_credito')
        .insert({ ...cartao, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartoes'] });
      toast.success('Cartão criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar cartão: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CartaoCredito> & { id: string }) => {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartoes'] });
      toast.success('Cartão atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar cartão: ' + error.message);
    },
  });

  return {
    cartoes,
    isLoading,
    createCartao: createMutation.mutate,
    updateCartao: updateMutation.mutate,
  };
}
