import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TipoParcelamento } from '@/types/parcelamentos';
import { toast } from 'sonner';

export function useTiposParcelamento() {
  const queryClient = useQueryClient();

  const { data: tipos = [], isLoading } = useQuery({
    queryKey: ['tipos-parcelamento'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tipos_parcelamento')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) throw error;
      return data as TipoParcelamento[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (tipo: Omit<TipoParcelamento, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tipos_parcelamento')
        .insert(tipo)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-parcelamento'] });
      toast.success('Tipo de parcelamento criado com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar tipo de parcelamento: ' + error.message);
    },
  });

  return {
    tipos,
    isLoading,
    createTipo: createMutation.mutate,
  };
}
