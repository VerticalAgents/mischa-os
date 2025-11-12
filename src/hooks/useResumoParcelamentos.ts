import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResumoParcelamentos } from '@/types/parcelamentos';

export function useResumoParcelamentos() {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ['resumo-parcelamentos'],
    queryFn: async () => {
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

      // Total de parcelamentos ativos
      const { count: totalAtivos } = await supabase
        .from('parcelamentos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Parcelas pendentes e valor total
      const { data: parcelasPendentes } = await supabase
        .from('parcelas')
        .select('valor_parcela')
        .eq('status', 'pendente');

      const valorTotalPendente = parcelasPendentes?.reduce(
        (sum, p) => sum + Number(p.valor_parcela),
        0
      ) || 0;

      // Parcelas vencendo no mês
      const { data: parcelasVencendoMes } = await supabase
        .from('parcelas')
        .select('valor_parcela')
        .eq('status', 'pendente')
        .gte('data_vencimento', inicioMes.toISOString())
        .lte('data_vencimento', fimMes.toISOString());

      const valorVencendoMes = parcelasVencendoMes?.reduce(
        (sum, p) => sum + Number(p.valor_parcela),
        0
      ) || 0;

      // Parcelas atrasadas
      const { data: parcelasAtrasadas } = await supabase
        .from('parcelas')
        .select('valor_parcela')
        .eq('status', 'atrasado');

      const valorAtrasado = parcelasAtrasadas?.reduce(
        (sum, p) => sum + Number(p.valor_parcela),
        0
      ) || 0;

      const resumo: ResumoParcelamentos = {
        total_parcelamentos_ativos: totalAtivos || 0,
        valor_total_pendente: valorTotalPendente,
        parcelas_vencendo_mes: parcelasVencendoMes?.length || 0,
        valor_vencendo_mes: valorVencendoMes,
        parcelas_atrasadas: parcelasAtrasadas?.length || 0,
        valor_atrasado: valorAtrasado,
      };

      return resumo;
    },
  });

  return {
    resumo,
    isLoading,
  };
}
