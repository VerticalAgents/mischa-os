
import { useState, useMemo } from 'react';
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

export const useGiroAnalysisConsolidated = (filtros: GiroAnalysisFilters = {}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { logAction } = useAuditLog();

  // ÚNICA query para dados base - todas as outras são derivadas
  const {
    data: dadosConsolidados,
    isLoading,
    error,
    refetch: refetchDados
  } = useQuery({
    queryKey: ['giro-analysis-base', filtros],
    queryFn: () => GiroAnalysisService.getDadosConsolidados(filtros),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Computar overview localmente (sem query adicional)
  const overview = useMemo(() => {
    if (!dadosConsolidados?.length) return null;
    
    const totalClientes = dadosConsolidados.length;
    const giroMedioGeral = dadosConsolidados.reduce((acc, item) => acc + item.giro_medio_historico, 0) / totalClientes;
    const taxaAtingimentoGlobal = dadosConsolidados.reduce((acc, item) => acc + item.achievement_meta, 0) / totalClientes;
    const faturamentoTotalPrevisto = dadosConsolidados.reduce((acc, item) => acc + item.faturamento_semanal_previsto, 0);
    
    const distribuicaoSemaforo = dadosConsolidados.reduce((acc, item) => {
      acc[item.semaforo_performance] = (acc[item.semaforo_performance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalClientes,
      giroMedioGeral: Math.round(giroMedioGeral),
      taxaAtingimentoGlobal: Math.round(taxaAtingimentoGlobal),
      distribuicaoSemaforo,
      faturamentoTotalPrevisto: Math.round(faturamentoTotalPrevisto)
    };
  }, [dadosConsolidados]);

  // Computar ranking localmente (sem query adicional)
  const ranking = useMemo((): GiroRanking[] => {
    if (!dadosConsolidados?.length) return [];
    
    return dadosConsolidados
      .sort((a, b) => b.giro_medio_historico - a.giro_medio_historico)
      .map((item, index) => {
        const giroAnterior = item.giro_medio_historico - (item.giro_ultima_semana - item.giro_medio_historico);
        const variacao = item.variacao_percentual;
        
        let tendencia: 'crescimento' | 'queda' | 'estavel' = 'estavel';
        if (variacao > 5) tendencia = 'crescimento';
        else if (variacao < -5) tendencia = 'queda';

        return {
          posicao: index + 1,
          cliente_id: item.cliente_id,
          cliente_nome: item.cliente_nome,
          giro_atual: item.giro_medio_historico,
          giro_anterior: giroAnterior,
          tendencia,
          variacao_percentual: variacao,
          achievement_meta: item.achievement_meta
        };
      });
  }, [dadosConsolidados]);

  // Computar dados regionais localmente (sem query adicional)
  const regional = useMemo((): GiroRegionalData[] => {
    if (!dadosConsolidados?.length) return [];
    
    const regionalMap = dadosConsolidados.reduce((acc, item) => {
      const rota = item.rota_entrega_nome || 'Sem rota';
      
      if (!acc[rota]) {
        acc[rota] = {
          rota_entrega: rota,
          total_clientes: 0,
          giro_total: 0,
          achievement_total: 0,
          faturamento_total: 0,
          performance_counts: { verde: 0, amarelo: 0, vermelho: 0 }
        };
      }

      acc[rota].total_clientes++;
      acc[rota].giro_total += item.giro_medio_historico;
      acc[rota].achievement_total += item.achievement_meta;
      acc[rota].faturamento_total += item.faturamento_semanal_previsto;
      acc[rota].performance_counts[item.semaforo_performance]++;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(regionalMap).map((item: any) => {
      const giroMedio = item.giro_total / item.total_clientes;
      const achievementMedio = item.achievement_total / item.total_clientes;
      
      let performanceGeral: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
      if (item.performance_counts.verde > item.performance_counts.amarelo && 
          item.performance_counts.verde > item.performance_counts.vermelho) {
        performanceGeral = 'verde';
      } else if (item.performance_counts.amarelo > item.performance_counts.vermelho) {
        performanceGeral = 'amarelo';
      }

      return {
        rota_entrega: item.rota_entrega,
        total_clientes: item.total_clientes,
        giro_medio: Math.round(giroMedio),
        achievement_medio: Math.round(achievementMedio),
        faturamento_previsto: Math.round(item.faturamento_total),
        performance_geral: performanceGeral
      };
    });
  }, [dadosConsolidados]);

  const refreshAll = async () => {
    setIsRefreshing(true);
    try {
      await logAction({
        action: 'GIRO_ANALYSIS_REFRESH',
        table_name: 'dados_analise_giro_materialized',
        new_values: {
          action: 'manual_refresh',
          filters: filtros,
          timestamp: new Date().toISOString()
        }
      });

      console.log('🔄 Refreshing materialized view...');
      await GiroAnalysisService.refreshMaterializedView();
      
      console.log('📊 Populating historical data...');
      await GiroAnalysisService.populateHistoricalData();
      
      console.log('🗑️ Clearing cache...');
      await GiroAnalysisService.clearCache();
      
      console.log('♻️ Refetching data...');
      await refetchDados();
      
      console.log('✅ Data refresh completed');

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
    ranking,
    regional,
    isLoading,
    isRefreshing,
    error,
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
