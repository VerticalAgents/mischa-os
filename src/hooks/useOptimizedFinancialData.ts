
import { useState, useEffect, useMemo } from 'react';
import { useFaturamentoPrevisto } from './useFaturamentoPrevisto';
import { useSupabaseCustosFixos } from './useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from './useSupabaseCustosVariaveis';

export const useOptimizedFinancialData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load all data in parallel
  const faturamentoQuery = useFaturamentoPrevisto();
  const custosFixosQuery = useSupabaseCustosFixos();
  const custosVariaveisQuery = useSupabaseCustosVariaveis();

  // Memoize the loading state
  const isLoading = useMemo(() => {
    return faturamentoQuery.isLoading || custosFixosQuery.isLoading || custosVariaveisQuery.isLoading;
  }, [faturamentoQuery.isLoading, custosFixosQuery.isLoading, custosVariaveisQuery.isLoading]);

  // Memoize the error state - since the hooks don't return error, we'll handle this internally
  const hasError = useMemo(() => {
    return false; // The hooks handle their own errors with toast notifications
  }, []);

  // Update loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Update error state
  useEffect(() => {
    if (hasError) {
      setError('Erro ao carregar dados financeiros');
    } else {
      setError(null);
    }
  }, [hasError]);

  // Memoize financial data
  const financialData = useMemo(() => {
    if (isLoading) return null;

    return {
      faturamento: {
        mensal: faturamentoQuery.faturamentoMensal || 0,
        semanal: faturamentoQuery.faturamentoSemanal || 0,
        detalhes: faturamentoQuery.precosDetalhados || []
      },
      custosFixos: {
        dados: custosFixosQuery.custosFixos || [],
        total: custosFixosQuery.custosFixos?.reduce((acc, custo) => acc + (custo.valor || 0), 0) || 0
      },
      custosVariaveis: {
        dados: custosVariaveisQuery.custosVariaveis || [],
        total: custosVariaveisQuery.custosVariaveis?.reduce((acc, custo) => acc + (custo.valor || 0), 0) || 0
      }
    };
  }, [
    isLoading,
    faturamentoQuery.faturamentoMensal,
    faturamentoQuery.faturamentoSemanal,
    faturamentoQuery.precosDetalhados,
    custosFixosQuery.custosFixos,
    custosVariaveisQuery.custosVariaveis
  ]);

  return {
    data: financialData,
    loading,
    error,
    refetch: () => {
      faturamentoQuery.recalcular?.();
      custosFixosQuery.recarregarCustosFixos?.();
      custosVariaveisQuery.recarregarCustosVariaveis?.();
    }
  };
};
