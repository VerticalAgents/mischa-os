
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface FinancialCacheData {
  faturamentoMensal: number;
  faturamentoSemanal: number;
  precosDetalhados: any[];
  totalCustosFixos: number;
  totalCustosVariaveis: number;
  totalCustoInsumos: number;
  lucroOperacional: number;
  margemBruta: number;
  margemOperacional: number;
  pontoEquilibrio: number;
  ticketMedio: number;
  lastUpdated: Date;
}

export const FINANCIAL_CACHE_KEY = 'financial-data';
export const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

export const useFinancialCache = () => {
  const queryClient = useQueryClient();

  const invalidateCache = useCallback(() => {
    console.log('🔄 Invalidando cache financeiro...');
    queryClient.invalidateQueries({ queryKey: [FINANCIAL_CACHE_KEY] });
  }, [queryClient]);

  const refreshData = useCallback(() => {
    console.log('🔄 Forçando refresh dos dados financeiros...');
    queryClient.refetchQueries({ queryKey: [FINANCIAL_CACHE_KEY] });
  }, [queryClient]);

  const getCachedData = useCallback(() => {
    return queryClient.getQueryData<FinancialCacheData>([FINANCIAL_CACHE_KEY]);
  }, [queryClient]);

  const setCachedData = useCallback((data: FinancialCacheData) => {
    queryClient.setQueryData([FINANCIAL_CACHE_KEY], data);
  }, [queryClient]);

  return {
    invalidateCache,
    refreshData,
    getCachedData,
    setCachedData,
    cacheKey: FINANCIAL_CACHE_KEY,
    cacheDuration: CACHE_DURATION
  };
};
