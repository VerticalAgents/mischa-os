import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClienteStore } from '@/hooks/useClienteStore';

interface GiroMedioPorPDVResult {
  giroMedioPorPDV: number;
  giroTotal: number;
  totalClientesAtivos: number;
  // Comparação de tendência (4 semanas vs histórico)
  giro4Semanas: number;           // Média últimas 4 semanas consolidadas
  giro12Semanas: number;          // Média histórica (primeiras 8 semanas)
  giroMedio4Semanas: number;      // Média 4 semanas ÷ clientes ativos
  giroMedio12Semanas: number;     // Média 12 semanas ÷ clientes ativos
  variacaoGiroTotal: number;      // % variação (4sem vs 12sem)
  variacaoGiroMedio: number;      // % variação (4sem vs 12sem)
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

  // Helper para obter número da semana ISO
  const getISOWeek = (date: Date): string => {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${tempDate.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  };

  // Query para buscar entregas dos últimos 84 dias agrupadas por semana
  const { data, isLoading, error } = useQuery({
    queryKey: ['giro-semanal-total', representanteId],
    queryFn: async () => {
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 84);

      // Busca todas as entregas
      const { data: entregas, error: entregasError } = await supabase
        .from('historico_entregas')
        .select('quantidade, data')
        .gte('data', dataLimite.toISOString())
        .eq('tipo', 'entrega');

      if (entregasError) throw entregasError;

      // Agrupar entregas por semana
      const entregasPorSemana: Record<string, number> = {};
      entregas?.forEach(e => {
        const semana = getISOWeek(new Date(e.data));
        entregasPorSemana[semana] = (entregasPorSemana[semana] || 0) + (e.quantidade || 0);
      });

      // Ordenar semanas
      const semanasOrdenadas = Object.keys(entregasPorSemana).sort();
      
      // Separar semanas: excluir a semana atual (incompleta)
      const semanaAtual = getISOWeek(new Date());
      const semanasConsolidadas = semanasOrdenadas.filter(s => s !== semanaAtual);

      // Últimas 4 semanas consolidadas
      const ultimas4Semanas = semanasConsolidadas.slice(-4);
      const total4Semanas = ultimas4Semanas.reduce((sum, s) => sum + (entregasPorSemana[s] || 0), 0);
      const giro4Semanas = ultimas4Semanas.length > 0 ? Math.round(total4Semanas / ultimas4Semanas.length) : 0;

      // Primeiras 8 semanas (histórico para comparação)
      const primeiras8Semanas = semanasConsolidadas.slice(0, 8);
      const total8Semanas = primeiras8Semanas.reduce((sum, s) => sum + (entregasPorSemana[s] || 0), 0);
      const giro12Semanas = primeiras8Semanas.length > 0 ? Math.round(total8Semanas / primeiras8Semanas.length) : 0;

      // Cálculo geral (todas as 12 semanas)
      const totalEntregas = entregas?.reduce((sum, e) => sum + (e.quantidade || 0), 0) ?? 0;
      const giroSemanalTotal = Math.round(totalEntregas / 12) || 0;

      return {
        giroSemanalTotal,
        totalEntregas,
        giro4Semanas,
        giro12Semanas
      };
    },
    enabled: !clientesLoading,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const giroMedioPorPDV = useMemo(() => {
    if (!data || clientesAtivos.length === 0) return 0;
    const giro = data.giroSemanalTotal ?? 0;
    if (typeof giro !== 'number' || isNaN(giro)) return 0;
    return Math.round(giro / clientesAtivos.length);
  }, [data, clientesAtivos.length]);

  const giroTotal = useMemo(() => {
    const value = data?.giroSemanalTotal;
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return value;
  }, [data?.giroSemanalTotal]);

  // Cálculos de tendência (4 semanas vs histórico)
  const giro4Semanas = useMemo(() => {
    const value = data?.giro4Semanas;
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return value;
  }, [data?.giro4Semanas]);

  const giro12Semanas = useMemo(() => {
    const value = data?.giro12Semanas;
    if (typeof value !== 'number' || isNaN(value)) return 0;
    return value;
  }, [data?.giro12Semanas]);

  const giroMedio4Semanas = useMemo(() => {
    if (!data || clientesAtivos.length === 0) return 0;
    const giro = data.giro4Semanas ?? 0;
    if (typeof giro !== 'number' || isNaN(giro)) return 0;
    return Math.round(giro / clientesAtivos.length);
  }, [data, clientesAtivos.length]);

  const giroMedio12Semanas = useMemo(() => {
    if (!data || clientesAtivos.length === 0) return 0;
    const giro = data.giro12Semanas ?? 0;
    if (typeof giro !== 'number' || isNaN(giro)) return 0;
    return Math.round(giro / clientesAtivos.length);
  }, [data, clientesAtivos.length]);

  const variacaoGiroTotal = useMemo(() => {
    if (giro12Semanas === 0) return 0;
    return Number((((giro4Semanas / giro12Semanas) - 1) * 100).toFixed(1));
  }, [giro4Semanas, giro12Semanas]);

  const variacaoGiroMedio = useMemo(() => {
    if (giroMedio12Semanas === 0) return 0;
    return Number((((giroMedio4Semanas / giroMedio12Semanas) - 1) * 100).toFixed(1));
  }, [giroMedio4Semanas, giroMedio12Semanas]);

  return {
    giroMedioPorPDV,
    giroTotal,
    totalClientesAtivos: clientesAtivos.length,
    giro4Semanas,
    giro12Semanas,
    giroMedio4Semanas,
    giroMedio12Semanas,
    variacaoGiroTotal,
    variacaoGiroMedio,
    isLoading: isLoading || clientesLoading,
    error: error as Error | null
  };
};
