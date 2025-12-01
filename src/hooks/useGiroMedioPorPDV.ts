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
 * Hook unificado para cálculo do Giro Médio por PDV
 * 
 * Fórmula: Soma(giro_real_por_cliente) / Total de Clientes Ativos
 * 
 * Onde giro_real_por_cliente = soma de entregas dos últimos 84 dias / número de semanas (min 1, max 12)
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

  // Query para buscar entregas dos últimos 84 dias
  const { data, isLoading, error } = useQuery({
    queryKey: ['giro-medio-por-pdv', clienteIds.join(','), representanteId],
    queryFn: async () => {
      if (clienteIds.length === 0) {
        return { giroTotal: 0, clientesComGiro: 0 };
      }

      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 84);

      const { data: entregas, error: entregasError } = await supabase
        .from('historico_entregas')
        .select('cliente_id, quantidade, data')
        .in('cliente_id', clienteIds)
        .gte('data', dataLimite.toISOString())
        .eq('tipo', 'entrega');

      if (entregasError) throw entregasError;

      // Agrupar entregas por cliente e calcular giro individual
      const entregasPorCliente: Record<string, { total: number; primeiraEntrega: Date }> = {};

      entregas?.forEach(entrega => {
        const clienteId = entrega.cliente_id;
        const dataEntrega = new Date(entrega.data);
        
        if (!entregasPorCliente[clienteId]) {
          entregasPorCliente[clienteId] = {
            total: 0,
            primeiraEntrega: dataEntrega
          };
        }
        
        entregasPorCliente[clienteId].total += entrega.quantidade;
        
        if (dataEntrega < entregasPorCliente[clienteId].primeiraEntrega) {
          entregasPorCliente[clienteId].primeiraEntrega = dataEntrega;
        }
      });

      // Calcular giro semanal de cada cliente
      const hoje = new Date();
      let giroTotalCalculado = 0;

      Object.entries(entregasPorCliente).forEach(([_, dados]) => {
        // Calcular número de semanas desde a primeira entrega (min 1, max 12)
        const diasDesdeInicio = Math.floor(
          (hoje.getTime() - dados.primeiraEntrega.getTime()) / (1000 * 60 * 60 * 24)
        );
        const semanasReais = Math.max(1, Math.min(12, Math.ceil(diasDesdeInicio / 7)));
        
        // Giro semanal do cliente = total / semanas
        const giroSemanalCliente = dados.total / semanasReais;
        giroTotalCalculado += giroSemanalCliente;
      });

      return {
        giroTotal: Math.round(giroTotalCalculado),
        clientesComGiro: Object.keys(entregasPorCliente).length
      };
    },
    enabled: !clientesLoading && clienteIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const giroMedioPorPDV = useMemo(() => {
    if (!data || clientesAtivos.length === 0) return 0;
    return Math.round(data.giroTotal / clientesAtivos.length);
  }, [data, clientesAtivos.length]);

  return {
    giroMedioPorPDV,
    giroTotal: data?.giroTotal || 0,
    totalClientesAtivos: clientesAtivos.length,
    isLoading: isLoading || clientesLoading,
    error: error as Error | null
  };
};
