
import { useState, useEffect } from 'react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCustosFixos } from '@/hooks/useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from '@/hooks/useSupabaseCustosVariaveis';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { calculateDREFromRealData, DRECalculationResult } from '@/services/dreCalculations';
import { DREData, ChannelData } from '@/types/projections';

export interface DREDataHook {
  dreData: DREData | null;
  dreCalculationResult: DRECalculationResult | null;
  isLoading: boolean;
  error: string | null;
  recalculate: () => Promise<void>;
}

export const useDREData = (): DREDataHook => {
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [dreCalculationResult, setDreCalculationResult] = useState<DRECalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { clientes } = useClienteStore();
  const { custosFixos } = useSupabaseCustosFixos();
  const { custosVariaveis } = useSupabaseCustosVariaveis();
  const { faturamentoMensal, precosDetalhados } = useFaturamentoPrevisto();

  const calculateDRE = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Calculando DRE com dados reais...');
      console.log('Clientes ativos:', clientes.filter(c => c.statusCliente === 'Ativo').length);
      console.log('Custos fixos:', custosFixos.length);
      console.log('Custos variáveis:', custosVariaveis.length);
      
      const calculationResult = await calculateDREFromRealData(
        clientes,
        custosFixos,
        custosVariaveis,
        { faturamentoMensal, precosDetalhados }
      );
      
      console.log('✅ DRE calculada:', calculationResult);
      
      // Converter para formato DREData para compatibilidade
      const channelsData: ChannelData[] = calculationResult.detalhesCalculos.faturamentoPorCategoria.map(cat => ({
        channel: mapCategoryToChannel(cat.categoria),
        volume: 0, // Não usado no novo sistema
        revenue: cat.faturamento,
        variableCosts: cat.custoInsumos,
        margin: cat.margem,
        marginPercent: cat.faturamento > 0 ? (cat.margem / cat.faturamento) * 100 : 0
      }));
      
      const dreDataConverted: DREData = {
        id: 'base-real',
        name: 'DRE Base (Dados Reais)',
        isBase: true,
        createdAt: new Date(),
        channelsData,
        fixedCosts: calculationResult.custosFixosDetalhados.map(c => ({ name: c.nome, value: c.valor })),
        administrativeCosts: calculationResult.custosAdministrativosDetalhados.map(c => ({ name: c.nome, value: c.valor })),
        investments: [], // Não usado no novo sistema
        totalRevenue: calculationResult.totalReceita,
        totalVariableCosts: calculationResult.totalCustosVariaveis,
        totalFixedCosts: calculationResult.totalCustosFixos,
        totalAdministrativeCosts: calculationResult.totalCustosAdministrativos,
        totalCosts: calculationResult.totalCustosVariaveis + calculationResult.totalCustosFixos + calculationResult.totalCustosAdministrativos,
        grossProfit: calculationResult.totalReceita - calculationResult.totalCustosVariaveis,
        grossMargin: calculationResult.margemBruta,
        operationalResult: calculationResult.lucroOperacional,
        operationalMargin: calculationResult.margemOperacional,
        totalInvestment: 0, // Não usado no novo sistema
        monthlyDepreciation: 0, // Não usado no novo sistema
        ebitda: calculationResult.ebitda,
        ebitdaMargin: calculationResult.totalReceita > 0 ? (calculationResult.ebitda / calculationResult.totalReceita) * 100 : 0,
        breakEvenPoint: calculationResult.pontoEquilibrio,
        paybackMonths: 0, // Não usado no novo sistema
        detailedBreakdown: {
          revendaPadraoFaturamento: calculationResult.receitaRevendaPadrao,
          foodServiceFaturamento: calculationResult.receitaFoodService,
          totalInsumosRevenda: calculationResult.custosInsumos * (calculationResult.receitaRevendaPadrao / calculationResult.totalReceita),
          totalInsumosFoodService: calculationResult.custosInsumos * (calculationResult.receitaFoodService / calculationResult.totalReceita),
          totalLogistica: calculationResult.custosLogisticos,
          aquisicaoClientes: calculationResult.custosAquisicaoClientes
        }
      };
      
      setDreData(dreDataConverted);
      setDreCalculationResult(calculationResult);
      
    } catch (err) {
      console.error('❌ Erro ao calcular DRE:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const recalculate = async () => {
    await calculateDRE();
  };

  useEffect(() => {
    if (clientes.length > 0) {
      calculateDRE();
    }
  }, [clientes, custosFixos, custosVariaveis, faturamentoMensal]);

  return {
    dreData,
    dreCalculationResult,
    isLoading,
    error,
    recalculate
  };
};

// Helper para mapear categorias para canais
const mapCategoryToChannel = (category: string): any => {
  switch (category) {
    case 'revenda padrão': return 'B2B-Revenda';
    case 'food service': return 'B2B-FoodService';
    case 'ufcspa': return 'B2C-UFCSPA';
    case 'personalizados': return 'B2C-Personalizados';
    case 'outros': return 'B2C-Outros';
    default: return 'B2C-Outros';
  }
};
