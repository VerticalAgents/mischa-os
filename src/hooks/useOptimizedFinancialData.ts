
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
    return faturamentoQuery.loading || custosFixosQuery.loading || custosVariaveisQuery.loading;
  }, [faturamentoQuery.loading, custosFixosQuery.loading, custosVariaveisQuery.loading]);

  // Memoize the error state
  const hasError = useMemo(() => {
    return faturamentoQuery.error || custosFixosQuery.error || custosVariaveisQuery.error;
  }, [faturamentoQuery.error, custosFixosQuery.error, custosVariaveisQuery.error]);

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
        detalhes: faturamentoQuery.detalhesFaturamento || []
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
    faturamentoQuery.detalhesFaturamento,
    custosFixosQuery.custosFixos,
    custosVariaveisQuery.custosVariaveis
  ]);

  return {
    data: financialData,
    loading,
    error,
    refetch: () => {
      faturamentoQuery.refetch?.();
      custosFixosQuery.carregarCustosFixos?.();
      custosVariaveisQuery.carregarCustosVariaveis?.();
    }
  };
};
