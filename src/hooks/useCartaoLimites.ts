import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useCartaoLimites(cartaoId: string | null) {
  return useQuery({
    queryKey: ['cartao-limites', cartaoId],
    queryFn: async () => {
      if (!cartaoId) return null;

      // Buscar cartão
      const { data: cartao, error: cartaoError } = await supabase
        .from('cartoes_credito')
        .select('limite_credito')
        .eq('id', cartaoId)
        .single();

      if (cartaoError) throw cartaoError;

      // Buscar parcelamentos ativos desse cartão
      const { data: parcelamentos, error: parcelamentosError } = await supabase
        .from('parcelamentos')
        .select('id, valor_total')
        .eq('cartao_id', cartaoId)
        .eq('status', 'ativo');

      if (parcelamentosError) throw parcelamentosError;

      const limiteTotal = Number(cartao.limite_credito) || 0;
      const valorComprometido = parcelamentos?.reduce((acc, p) => acc + Number(p.valor_total), 0) || 0;
      const limiteDisponivel = limiteTotal - valorComprometido;
      const percentualUtilizado = limiteTotal > 0 ? (valorComprometido / limiteTotal) * 100 : 0;

      return {
        limiteTotal,
        valorComprometido,
        limiteDisponivel,
        percentualUtilizado,
      };
    },
    enabled: !!cartaoId,
  });
}
