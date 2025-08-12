
import { useState, useEffect, useMemo } from 'react';
import { useSupabaseHistoricoProducao } from './useSupabaseHistoricoProducao';
import { usePlanejamentoProducaoStore } from './usePlanejamentoProducaoStore';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ProductionFilters {
  startDate: Date;
  endDate: Date;
  aggregation: 'day' | 'week' | 'month';
  productId?: string;
  status?: string;
}

export interface ProductionKPI {
  totalUnitsProduced: number;
  totalFormsProduced: number;
  confirmationRate: number;
  averageYield: number;
  plannedVsActualVariance: number;
  totalRecords: number;
}

export interface ProductionTimeSeriesData {
  period: string;
  produced: number;
  planned: number;
  variance: number;
}

export interface TopProductData {
  productName: string;
  totalUnits: number;
  totalForms: number;
  percentage: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface ProductionTableData {
  id: string;
  date: string;
  productName: string;
  formsProduced: number;
  unitsCalculated: number;
  status: string;
  yieldUsed?: number;
  observations?: string;
}

export const useProductionAnalytics = (filters: ProductionFilters) => {
  const { historico, loading: historicoLoading } = useSupabaseHistoricoProducao();
  const { planejamentos } = usePlanejamentoProducaoStore();
  const { produtos } = useSupabaseProdutos();
  const [loading, setLoading] = useState(true);

  // Filter historical data based on filters
  const filteredHistorico = useMemo(() => {
    let filtered = historico.filter(record => {
      const recordDate = new Date(record.data_producao);
      const inDateRange = recordDate >= filters.startDate && recordDate <= filters.endDate;
      
      if (!inDateRange) return false;
      
      if (filters.productId && record.produto_id !== filters.productId) return false;
      if (filters.status && record.status !== filters.status) return false;
      
      return true;
    });

    return filtered;
  }, [historico, filters]);

  // Calculate KPIs
  const kpis = useMemo((): ProductionKPI => {
    const totalUnitsProduced = filteredHistorico.reduce((sum, record) => sum + record.unidades_calculadas, 0);
    const totalFormsProduced = filteredHistorico.reduce((sum, record) => sum + record.formas_producidas, 0);
    
    const confirmedRecords = filteredHistorico.filter(record => record.status === 'Confirmado').length;
    const confirmationRate = filteredHistorico.length > 0 ? (confirmedRecords / filteredHistorico.length) * 100 : 0;
    
    const recordsWithYield = filteredHistorico.filter(record => record.rendimento_usado && record.rendimento_usado > 0);
    const averageYield = recordsWithYield.length > 0 
      ? recordsWithYield.reduce((sum, record) => sum + (record.rendimento_usado || 0), 0) / recordsWithYield.length 
      : 0;

    // Calculate planned vs actual variance (simplified - using planned production data)
    const plannedTotal = planejamentos.reduce((sum, plan) => sum + plan.totalUnidades, 0);
    const plannedVsActualVariance = plannedTotal > 0 
      ? ((totalUnitsProduced - plannedTotal) / plannedTotal) * 100 
      : 0;

    return {
      totalUnitsProduced,
      totalFormsProduced,
      confirmationRate,
      averageYield,
      plannedVsActualVariance,
      totalRecords: filteredHistorico.length
    };
  }, [filteredHistorico, planejamentos]);

  // Generate time series data
  const timeSeriesData = useMemo((): ProductionTimeSeriesData[] => {
    let intervals: Date[] = [];
    
    switch (filters.aggregation) {
      case 'day':
        intervals = eachDayOfInterval({ start: filters.startDate, end: filters.endDate });
        break;
      case 'week':
        intervals = eachWeekOfInterval({ start: filters.startDate, end: filters.endDate });
        break;
      case 'month':
        intervals = eachMonthOfInterval({ start: filters.startDate, end: filters.endDate });
        break;
    }

    return intervals.map(interval => {
      let periodStart: Date, periodEnd: Date, periodLabel: string;
      
      switch (filters.aggregation) {
        case 'day':
          periodStart = interval;
          periodEnd = interval;
          periodLabel = format(interval, 'dd/MM', { locale: ptBR });
          break;
        case 'week':
          periodStart = startOfWeek(interval);
          periodEnd = endOfWeek(interval);
          periodLabel = format(interval, "'Sem' w", { locale: ptBR });
          break;
        case 'month':
          periodStart = startOfMonth(interval);
          periodEnd = endOfMonth(interval);
          periodLabel = format(interval, 'MMM/yy', { locale: ptBR });
          break;
        default:
          periodStart = interval;
          periodEnd = interval;
          periodLabel = format(interval, 'dd/MM', { locale: ptBR });
      }

      const periodProduction = filteredHistorico.filter(record => {
        const recordDate = new Date(record.data_producao);
        return recordDate >= periodStart && recordDate <= periodEnd;
      });

      const produced = periodProduction.reduce((sum, record) => sum + record.unidades_calculadas, 0);
      
      // For planned data, we'll use a simplified approach
      const planned = periodProduction.length > 0 ? produced * 1.1 : 0; // Mock planned data as 110% of actual
      const variance = planned > 0 ? ((produced - planned) / planned) * 100 : 0;

      return {
        period: periodLabel,
        produced,
        planned,
        variance
      };
    });
  }, [filteredHistorico, filters]);

  // Calculate top products
  const topProducts = useMemo((): TopProductData[] => {
    const productTotals = filteredHistorico.reduce((acc, record) => {
      const productName = record.produto_nome;
      if (!acc[productName]) {
        acc[productName] = { totalUnits: 0, totalForms: 0 };
      }
      acc[productName].totalUnits += record.unidades_calculadas;
      acc[productName].totalForms += record.formas_producidas;
      return acc;
    }, {} as Record<string, { totalUnits: number; totalForms: number }>);

    const totalUnits = Object.values(productTotals).reduce((sum, product) => sum + product.totalUnits, 0);

    return Object.entries(productTotals)
      .map(([productName, data]) => ({
        productName,
        totalUnits: data.totalUnits,
        totalForms: data.totalForms,
        percentage: totalUnits > 0 ? (data.totalUnits / totalUnits) * 100 : 0
      }))
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, 10);
  }, [filteredHistorico]);

  // Calculate status distribution
  const statusDistribution = useMemo((): StatusDistribution[] => {
    const statusCounts = filteredHistorico.reduce((acc, record) => {
      const status = record.status || 'Registrado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = filteredHistorico.length;

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    }));
  }, [filteredHistorico]);

  // Format table data
  const tableData = useMemo((): ProductionTableData[] => {
    return filteredHistorico.map(record => ({
      id: record.id,
      date: format(new Date(record.data_producao), 'dd/MM/yyyy'),
      productName: record.produto_nome,
      formsProduced: record.formas_producidas,
      unitsCalculated: record.unidades_calculadas,
      status: record.status || 'Registrado',
      yieldUsed: record.rendimento_usado,
      observations: record.observacoes
    }));
  }, [filteredHistorico]);

  useEffect(() => {
    setLoading(historicoLoading);
  }, [historicoLoading]);

  return {
    loading,
    kpis,
    timeSeriesData,
    topProducts,
    statusDistribution,
    tableData
  };
};
