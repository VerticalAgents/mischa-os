
import { useState, useEffect } from 'react';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseCustosFixos } from '@/hooks/useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from '@/hooks/useSupabaseCustosVariaveis';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { useProjecaoIndicadores } from '@/hooks/useProjecaoIndicadores';
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
  const { faturamentoMensal, precosDetalhados, disponivel } = useFaturamentoPrevisto();
  const { indicadores: projecaoIndicadores, isLoading: projecaoLoading } = useProjecaoIndicadores();

  const calculateDRE = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Aguardar até que os dados de faturamento e projeção estejam disponíveis
      if (!disponivel || !precosDetalhados || precosDetalhados.length === 0 || !projecaoIndicadores || projecaoLoading) {
        console.log('⏳ Aguardando dados de faturamento e projeção...');
        setIsLoading(false);
        return;
      }
      
      console.log('🔄 Calculando DRE com dados dinâmicos da projeção...');
      
      const calculationResult = await calculateDREFromRealData(
        clientes,
        custosFixos,
        custosVariaveis,
        { faturamentoMensal, precosDetalhados }
      );
      
      console.log('✅ DRE calculada com sucesso:', calculationResult);
      
      // USAR VALORES DINÂMICOS DA PROJEÇÃO (não mais hardcoded)
      const receitaTotal = projecaoIndicadores.faturamentoGeralMensal;
      const revendaPadrao = projecaoIndicadores.faturamentoRevendaPadrao;
      const foodService = projecaoIndicadores.faturamentoFoodService;
      
      // VALORES DINÂMICOS - Logística e Insumos da projeção real
      const logistica = projecaoIndicadores.custoLogistico;
      const totalInsumos = projecaoIndicadores.totalCustoInsumosMensal;
      const insumosRevendaPadrao = projecaoIndicadores.custoInsumosRevendaPadrao;
      const insumosFoodService = projecaoIndicadores.custoInsumosFoodService;
      
      const aquisicaoClientes = receitaTotal * 0.08; // 8% da receita
      
      // Recalcular total de custos variáveis com valores dinâmicos
      const totalCustosVariaveis = logistica + totalInsumos + aquisicaoClientes;
      
      const custoFixosTotal = custosFixos.reduce((sum, custo) => 
        sum + (custo.frequencia === 'anual' ? custo.valor / 12 : custo.valor), 0
      );
      const custosAdministrativos = custosVariaveis
        .filter(custo => custo.subcategoria === 'Administrativo')
        .reduce((sum, custo) => sum + (custo.frequencia === 'anual' ? custo.valor / 12 : custo.valor), 0);
      
      const impostos = projecaoIndicadores.impostos; // Usar impostos calculados dinamicamente
      
      // Calcular valores derivados usando os valores dinâmicos
      const lucroBruto = receitaTotal - totalCustosVariaveis;
      const lucroOperacional = lucroBruto - custoFixosTotal - custosAdministrativos;
      const resultadoLiquido = lucroOperacional - impostos;

      console.log('📊 Valores dinâmicos da DRE (sincronizados com projeção):', {
        receitaTotal,
        logistica,
        totalInsumos,
        insumosRevendaPadrao,
        insumosFoodService,
        aquisicaoClientes,
        totalCustosVariaveis,
        lucroBruto,
        lucroOperacional,
        resultadoLiquido
      });

      // Criar dados de canais baseados nos valores dinâmicos
      const channelsData: ChannelData[] = [
        {
          channel: 'B2B-Revenda',
          volume: 0,
          revenue: revendaPadrao,
          variableCosts: revendaPadrao * (totalCustosVariaveis / receitaTotal),
          margin: revendaPadrao * (lucroBruto / receitaTotal),
          marginPercent: (lucroBruto / receitaTotal) * 100
        },
        {
          channel: 'B2B-FoodService',
          volume: 0,
          revenue: foodService,
          variableCosts: foodService * (totalCustosVariaveis / receitaTotal),
          margin: foodService * (lucroBruto / receitaTotal),
          marginPercent: (lucroBruto / receitaTotal) * 100
        },
        {
          channel: 'B2C-UFCSPA',
          volume: 0,
          revenue: 0,
          variableCosts: 0,
          margin: 0,
          marginPercent: 0
        },
        {
          channel: 'B2C-Personalizados',
          volume: 0,
          revenue: 0,
          variableCosts: 0,
          margin: 0,
          marginPercent: 0
        },
        {
          channel: 'B2C-Outros',
          volume: 0,
          revenue: 0,
          variableCosts: 0,
          margin: 0,
          marginPercent: 0
        }
      ];
      
      // Criar estrutura DREData usando valores dinâmicos da projeção
      const dreDataDinamica: DREData = {
        id: 'base-dinamica',
        name: 'DRE Base (Dados Dinâmicos da Projeção)',
        isBase: true,
        createdAt: new Date(),
        channelsData,
        fixedCosts: custosFixos.map(custo => ({
          name: custo.nome,
          value: custo.frequencia === 'anual' ? custo.valor / 12 : custo.valor
        })),
        administrativeCosts: custosVariaveis.filter(custo => custo.subcategoria === 'Administrativo').map(custo => ({
          name: custo.nome,
          value: custo.frequencia === 'anual' ? custo.valor / 12 : custo.valor
        })),
        investments: [],
        
        // VALORES PRINCIPAIS DA DRE (usando dados dinâmicos da projeção)
        totalRevenue: receitaTotal,
        totalVariableCosts: totalCustosVariaveis,
        totalFixedCosts: custoFixosTotal,
        totalAdministrativeCosts: custosAdministrativos,
        totalCosts: totalCustosVariaveis + custoFixosTotal + custosAdministrativos,
        
        // INDICADORES DE RENTABILIDADE (valores dinâmicos da projeção)
        grossProfit: lucroBruto,
        grossMargin: (lucroBruto / receitaTotal) * 100,
        operationalResult: lucroOperacional,
        operationalMargin: (lucroOperacional / receitaTotal) * 100,
        
        // Investimentos e depreciação
        totalInvestment: 0,
        monthlyDepreciation: 0,
        
        // EBITDA
        ebitda: lucroOperacional + 0,
        ebitdaMargin: ((lucroOperacional + 0) / receitaTotal) * 100,
        
        // Ponto de equilíbrio
        breakEvenPoint: custoFixosTotal / ((lucroBruto / receitaTotal)),
        paybackMonths: 0,
        
        // Breakdown detalhado com valores dinâmicos
        detailedBreakdown: {
          revendaPadraoFaturamento: revendaPadrao,
          foodServiceFaturamento: foodService,
          totalInsumosRevenda: insumosRevendaPadrao,
          totalInsumosFoodService: insumosFoodService,
          totalLogistica: logistica,
          aquisicaoClientes: aquisicaoClientes
        }
      };
      
      console.log('📊 DRE Base criada com valores DINÂMICOS (sincronizada com projeção em tempo real):', {
        receita: dreDataDinamica.totalRevenue,
        custosVariaveis: dreDataDinamica.totalVariableCosts,
        logistica: dreDataDinamica.detailedBreakdown?.totalLogistica,
        totalInsumos: (dreDataDinamica.detailedBreakdown?.totalInsumosRevenda || 0) + (dreDataDinamica.detailedBreakdown?.totalInsumosFoodService || 0),
        insumosRevendaPadrao: dreDataDinamica.detailedBreakdown?.totalInsumosRevenda,
        insumosFoodService: dreDataDinamica.detailedBreakdown?.totalInsumosFoodService,
        lucroBruto: dreDataDinamica.grossProfit,
        custoFixos: dreDataDinamica.totalFixedCosts,
        lucroOperacional: dreDataDinamica.operationalResult,
        resultadoLiquido: resultadoLiquido
      });
      
      setDreData(dreDataDinamica);
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
    if (clientes.length > 0 && disponivel && projecaoIndicadores && !projecaoLoading) {
      calculateDRE();
    }
  }, [clientes, custosFixos, custosVariaveis, faturamentoMensal, precosDetalhados, disponivel, projecaoIndicadores, projecaoLoading]);

  return {
    dreData,
    dreCalculationResult,
    isLoading: isLoading || projecaoLoading,
    error,
    recalculate
  };
};
