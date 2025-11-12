import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Parcela } from '@/types/parcelamentos';
import { toast } from 'sonner';

export function useParcelas(parcelamentoId?: string) {
  const queryClient = useQueryClient();

  const { data: parcelas = [], isLoading } = useQuery({
    queryKey: ['parcelas', parcelamentoId],
    queryFn: async () => {
      let query = supabase
        .from('parcelas')
        .select('*')
        .order('numero_parcela', { ascending: true });

      if (parcelamentoId) {
        query = query.eq('parcelamento_id', parcelamentoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Parcela[];
    },
    enabled: !!parcelamentoId,
  });

  const pagarMutation = useMutation({
    mutationFn: async ({ id, data_pagamento }: { id: string; data_pagamento: string }) => {
      const { data, error } = await supabase
        .from('parcelas')
        .update({ 
          status: 'pago',
          data_pagamento,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['parcelamentos'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-parcelamentos'] });
      toast.success('Parcela paga com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao pagar parcela: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Parcela> & { id: string }) => {
      const { data, error } = await supabase
        .from('parcelas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parcelas'] });
      queryClient.invalidateQueries({ queryKey: ['resumo-parcelamentos'] });
      toast.success('Parcela atualizada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar parcela: ' + error.message);
    },
  });

  return {
    parcelas,
    isLoading,
    pagarParcela: pagarMutation.mutate,
    updateParcela: updateMutation.mutate,
  };
}
