import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClienteStore } from '@/hooks/useClienteStore';

interface GiroMedioPorPDVResult {
  giroMedioPorPDV: number;
  giroTotal: number;
  totalClientesAtivos: number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook unificado para cálculo do Giro Semanal Total e Médio por PDV
 * 
 * Fórmula Giro Semanal Total: Total de entregas (84 dias) ÷ 12 semanas
 * Fórmula Giro Médio por PDV: Giro Semanal Total ÷ Total de Clientes Ativos
 * 
 * Este hook é usado em: Home, Gestão Comercial e Insights PDV
 */
export const useGiroMedioPorPDV = (representanteId?: string): GiroMedioPorPDVResult => {
  const { clientes, loading: clientesLoading } = useClienteStore();

  // Filtrar clientes ativos (opcionalmente por representante)
  const clientesAtivos = useMemo(() => {
    let filtered = clientes.filter(c => c.statusCliente === 'Ativo');
    
    if (representanteId && representanteId !== 'todos') {
      filtered = filtered.filter(c => c.representanteId?.toString() === representanteId);
    }
    
    return filtered;
  }, [clientes, representanteId]);

  const clienteIds = useMemo(() => clientesAtivos.map(c => c.id), [clientesAtivos]);

  // Query para buscar entregas dos últimos 84 dias (12 semanas)
  const { data, isLoading, error } = useQuery({
    queryKey: ['giro-medio-por-pdv', clienteIds.join(','), representanteId],
    queryFn: async () => {
      if (clienteIds.length === 0) {
        return { giroSemanalTotal: 0, totalEntregas: 0 };
      }

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 84);

      const { data: entregas, error: entregasError } = await supabase
        .from('historico_entregas')
        .select('quantidade')
        .in('cliente_id', clienteIds)
        .gte('data', dataLimite.toISOString())
        .eq('tipo', 'entrega');

      if (entregasError) throw entregasError;

      // Cálculo simples: total de entregas / 12 semanas
      const totalEntregas = entregas?.reduce((sum, e) => sum + e.quantidade, 0) || 0;
      const giroSemanalTotal = Math.round(totalEntregas / 12);

      return {
        giroSemanalTotal,
        totalEntregas
      };
    },
    enabled: !clientesLoading && clienteIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const giroMedioPorPDV = useMemo(() => {
    if (!data || clientesAtivos.length === 0) return 0;
    return Math.round(data.giroSemanalTotal / clientesAtivos.length);
  }, [data, clientesAtivos.length]);

  return {
    giroMedioPorPDV,
    giroTotal: data?.giroSemanalTotal || 0,
    totalClientesAtivos: clientesAtivos.length,
    isLoading: isLoading || clientesLoading,
    error: error as Error | null
  };
};
