
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  GiroAnalysisService, 
  DadosAnaliseGiroConsolidados,
  GiroAnalysisFilters,
  GiroRanking,
  GiroTemporalData,
  GiroRegionalData,
  GiroPredicao
} from '@/services/giroAnalysisService';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useToast } from '@/hooks/use-toast';

export const useGiroAnalysisConsolidated = (filtros: GiroAnalysisFilters = {}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logAction } = useAuditLog();
  const { toast } = useToast();

  const {
    data: dadosConsolidados,
    isLoading: loadingDados,
    error: errorDados,
    refetch: refetchDados
  } = useQuery({
    queryKey: ['giro-analysis-consolidated', filtros],
    queryFn: () => GiroAnalysisService.getDadosConsolidados(filtros),
    staleTime: 0, // Sempre considerar dados como obsoletos
    cacheTime: 0, // Não fazer cache
    refetchOnWindowFocus: false,
  });

  const {
    data: overview,
    isLoading: loadingOverview,
    error: errorOverview,
    refetch: refetchOverview
  } = useQuery({
    queryKey: ['giro-analysis-overview', filtros],
    queryFn: () => GiroAnalysisService.getGiroOverview(filtros),
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  });

  const {
    data: ranking,
    isLoading: loadingRanking,
    error: errorRanking,
    refetch: refetchRanking
  } = useQuery({
    queryKey: ['giro-analysis-ranking', filtros],
    queryFn: () => GiroAnalysisService.getGiroRanking(filtros),
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  });

  const {
    data: regional,
    isLoading: loadingRegional,
    error: errorRegional,
    refetch: refetchRegional
  } = useQuery({
    queryKey: ['giro-analysis-regional', filtros],
    queryFn: () => GiroAnalysisService.getGiroRegional(filtros),
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
  });

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Iniciando refresh completo dos dados de giro...');
      
      // Log the refresh action
      await logAction({
        action: 'GIRO_ANALYSIS_REFRESH',
        table_name: 'dados_analise_giro_materialized',
        new_values: {
          action: 'manual_refresh',
          filters: filtros,
          timestamp: new Date().toISOString()
        }
      });

      toast({
        title: "Atualizando dados",
        description: "Buscando as informações mais recentes...",
      });

      console.log('🔄 Refreshing materialized view...');
      await GiroAnalysisService.refreshMaterializedView();
      
      console.log('📊 Populating historical data...');
      await GiroAnalysisService.populateHistoricalData();
      
      console.log('🗑️ Clearing cache...');
      await GiroAnalysisService.clearCache();
      
      console.log('♻️ Refetching data...');
      await Promise.all([
        refetchDados(),
        refetchOverview(),
        refetchRanking(),
        refetchRegional()
      ]);
      
      console.log('✅ Data refresh completed');

      toast({
        title: "Dados atualizados",
        description: "As informações foram atualizadas com sucesso!",
      });

      // Log successful refresh
      await logAction({
        action: 'GIRO_ANALYSIS_REFRESH_SUCCESS',
        table_name: 'dados_analise_giro_materialized',
        new_values: {
          action: 'manual_refresh_completed',
          filters: filtros,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
      
      toast({
        title: "Erro na atualização",
        description: "Não foi possível atualizar os dados. Tente novamente.",
        variant: "destructive"
      });
      
      // Log failed refresh
      await logAction({
        action: 'GIRO_ANALYSIS_REFRESH_ERROR',
        table_name: 'dados_analise_giro_materialized',
        new_values: {
          action: 'manual_refresh_failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          filters: filtros,
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    dadosConsolidados: dadosConsolidados || [],
    overview,
    ranking: ranking || [],
    regional: regional || [],
    isLoading: loadingDados || loadingOverview || loadingRanking || loadingRegional,
    isRefreshing,
    error: errorDados || errorOverview || errorRanking || errorRegional,
    refreshAll
  };
};

export const useGiroTemporalData = (clienteId: string) => {
  return useQuery({
    queryKey: ['giro-temporal', clienteId],
    queryFn: () => GiroAnalysisService.getGiroTemporal(clienteId),
    enabled: !!clienteId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};

export const useGiroPredicao = (clienteId: string) => {
  return useQuery({
    queryKey: ['giro-predicao', clienteId],
    queryFn: () => GiroAnalysisService.getGiroPredicao(clienteId),
    enabled: !!clienteId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });
};
