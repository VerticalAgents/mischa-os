
import { useState, useEffect, useMemo } from 'react';
import { useSupabaseCustosFixos } from './useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from './useSupabaseCustosVariaveis';
import { useFaturamentoPrevisto } from './useFaturamentoPrevisto';
import { useClienteStore } from './useClienteStore';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFinancialCache, FinancialCacheData } from './useFinancialCache';

export const useOptimizedFinancialIndicators = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCachedData, getCachedData, cacheKey, cacheDuration } = useFinancialCache();
  
  const { custosFixos } = useSupabaseCustosFixos();
  const { custosVariaveis } = useSupabaseCustosVariaveis();
  const faturamentoPrevisto = useFaturamentoPrevisto();
  const { clientes } = useClienteStore();

  // Query para histórico de entregas (para ticket médio)
  const { data: historicoEntregas } = useQuery({
    queryKey: ['historico-entregas-ultimo-mes'],
    queryFn: async () => {
      const umMesAtras = new Date();
      umMesAtras.setMonth(umMesAtras.getMonth() - 1);
      
      const { data, error } = await supabase
        .from('historico_entregas')
        .select('*')
        .eq('tipo', 'entrega')
        .gte('data', umMesAtras.toISOString())
        .order('data', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: cacheDuration,
    gcTime: cacheDuration * 2
  });

  // Query principal com cache
  const { data: financialData, isLoading, error: queryError } = useQuery({
    queryKey: [cacheKey, custosFixos.length, custosVariaveis.length, faturamentoPrevisto.faturamentoMensal, clientes.length],
    queryFn: async (): Promise<FinancialCacheData> => {
      console.log('🔄 Recalculando indicadores financeiros...');
      
      // Calcular custos fixos normalizados para valor mensal
      const calcularValorMensal = (valor: number, frequencia: string): number => {
        switch (frequencia) {
          case 'semanal': return valor * 4;
          case 'trimestral': return valor / 3;
          case 'semestral': return valor / 6;
          case 'anual': return valor / 12;
          default: return valor;
        }
      };

      const totalCustosFixos = custosFixos.reduce((total, custo) => 
        total + calcularValorMensal(custo.valor, custo.frequencia), 0
      );

      // Calcular custos variáveis
      const { faturamentoMensal, faturamentoSemanal, precosDetalhados } = faturamentoPrevisto;
      
      // Custo de insumos baseado na lógica real
      const calcularCustoInsumos = (): number => {
        if (!clientes.length) return 0;
        const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio);
        const custoMedioInsumosPorUnidade = 2.10;
        const volumeMensalTotal = clientesAtivos.reduce((total, cliente) => {
          const volumeSemanal = cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao);
          return total + volumeSemanal * 4;
        }, 0);
        return volumeMensalTotal * custoMedioInsumosPorUnidade;
      };

      const totalCustoInsumos = calcularCustoInsumos();
      
      // Custos variáveis (impostos e logística usando percentuais reais)
      const custosLogisticos = faturamentoMensal * 0.038; // 3.8%
      const impostos = faturamentoMensal * 0.021; // 2.1%
      const aquisicaoClientes = faturamentoMensal * 0.08; // 8%
      
      const totalCustosVariaveis = totalCustoInsumos + custosLogisticos + impostos + aquisicaoClientes;

      // Custos administrativos
      const totalCustosAdministrativos = custosVariaveis.reduce((total, custo) => 
        total + calcularValorMensal(custo.valor, custo.frequencia), 0
      );

      // Calcular indicadores
      const lucroBruto = faturamentoMensal - totalCustosVariaveis;
      const margemBruta = faturamentoMensal > 0 ? (lucroBruto / faturamentoMensal) * 100 : 0;
      
      const lucroOperacional = lucroBruto - totalCustosFixos - totalCustosAdministrativos;
      const margemOperacional = faturamentoMensal > 0 ? (lucroOperacional / faturamentoMensal) * 100 : 0;

      // Ponto de equilíbrio dinâmico
      const margemContribuicao = faturamentoMensal > 0 ? (lucroBruto / faturamentoMensal) : 0;
      const pontoEquilibrio = margemContribuicao > 0 ? 
        (totalCustosFixos + totalCustosAdministrativos) / margemContribuicao : 0;

      // Ticket médio baseado no histórico real
      const ticketMedio = historicoEntregas && historicoEntregas.length > 0 ? 
        faturamentoMensal / historicoEntregas.length : 47.50;

      return {
        faturamentoMensal,
        faturamentoSemanal,
        precosDetalhados,
        totalCustosFixos,
        totalCustosVariaveis,
        totalCustoInsumos,
        lucroOperacional,
        margemBruta,
        margemOperacional,
        pontoEquilibrio,
        ticketMedio,
        lastUpdated: new Date()
      };
    },
    enabled: !!faturamentoPrevisto && !faturamentoPrevisto.isLoading && 
             custosFixos.length >= 0 && custosVariaveis.length >= 0 && clientes.length > 0,
    staleTime: cacheDuration,
    gcTime: cacheDuration * 2
  });

  // Atualizar cache quando dados mudam
  useEffect(() => {
    if (financialData) {
      setCachedData(financialData);
      setLoading(false);
      setError(null);
    }
  }, [financialData, setCachedData]);

  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
      setLoading(false);
    }
  }, [queryError]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  return {
    data: financialData,
    loading,
    error,
    lastUpdated: financialData?.lastUpdated || null,
    refetch: () => {
      console.log('🔄 Refazendo consulta de indicadores financeiros...');
      return faturamentoPrevisto.recalcular?.();
    }
  };
};
