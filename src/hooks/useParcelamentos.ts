import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Parcelamento } from '@/types/parcelamentos';
import { toast } from 'sonner';

export function useParcelamentos() {
  const queryClient = useQueryClient();

  const { data: parcelamentos = [], isLoading } = useQuery({
    queryKey: ['parcelamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelamentos')
        .select(`
          *,
          tipo_parcelamento:tipos_parcelamento(*),
          cartao:cartoes_credito(*)
        `)
        .order('data_compra', { ascending: false });

      if (error) throw error;
      return data as Parcelamento[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (parcelamento: Omit<Parcelamento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('parcelamentos')
        .insert(parcelamento)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelamentos'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-parcelamentos'] });
      toast.success('Parcelamento criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar parcelamento: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Parcelamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('parcelamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelamentos'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-parcelamentos'] });
      toast.success('Parcelamento atualizado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar parcelamento: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parcelamentos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelamentos'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-parcelamentos'] });
      toast.success('Parcelamento excluído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao excluir parcelamento: ' + error.message);
    },
  });

  return {
    parcelamentos,
    isLoading,
    createParcelamento: createMutation.mutate,
    updateParcelamento: updateMutation.mutate,
    deleteParcelamento: deleteMutation.mutate,
  };
}
