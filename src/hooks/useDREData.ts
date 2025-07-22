import { useQuery } from '@tanstack/react-query';
import { useClienteStore } from './useClienteStore';
import { useSupabaseCustosFixos } from './useSupabaseCustosFixos';
import { useSupabaseCustosVariaveis } from './useSupabaseCustosVariaveis';
import { useFaturamentoPrevisto } from './useFaturamentoPrevisto';
import { useProjecaoIndicadores } from './useProjecaoIndicadores';
import { DREData, ChannelData } from '@/types/projections';
import { v4 as uuidv4 } from 'uuid';

export function useDREData() {
  const { clientes } = useClienteStore();
  const { custosFixos } = useSupabaseCustosFixos();
  const { custosVariaveis } = useSupabaseCustosVariaveis();
  const { data: faturamentoPrevisto, isLoading: isLoadingFaturamento } = useFaturamentoPrevisto();
  const { indicadores } = useProjecaoIndicadores();

  const queryResult = useQuery({
    queryKey: ['dre-data', clientes.length, custosFixos.length, custosVariaveis.length, faturamentoPrevisto, indicadores],
    queryFn: async (): Promise<DREData> => {
      if (!faturamentoPrevisto || !faturamentoPrevisto.precosDetalhados || !indicadores) {
        throw new Error('Dados de faturamento ou indicadores não disponíveis');
      }

      // Usar os MESMOS percentuais da página "Projeção de Resultados por PDV"
      // Baseados nos valores reais mostrados na imagem: 2,1% impostos e 3,8% logística
      const PERCENTUAL_IMPOSTOS = 2.1; // 2,1% conforme mostrado na página
      const PERCENTUAL_LOGISTICA = 3.8; // 3,8% conforme mostrado na página
      
      // Calcular faturamento por categoria
      const faturamentoPorCategoria = new Map<string, number>();
      const custosInsumosPorCategoria = new Map<string, number>();
      
      faturamentoPrevisto.precosDetalhados.forEach(detalhe => {
        const categoria = getCategoryGroup(detalhe.categoriaNome);
        const faturamentoSemanal = detalhe.faturamentoSemanal * 4; // 4 semanas por mês
        
        faturamentoPorCategoria.set(categoria, 
          (faturamentoPorCategoria.get(categoria) || 0) + faturamentoSemanal
        );
        
        const custoInsumos = calculateInsumoCosts(faturamentoSemanal, detalhe.categoriaNome);
        custosInsumosPorCategoria.set(categoria,
          (custosInsumosPorCategoria.get(categoria) || 0) + custoInsumos
        );
      });

      const revendaPadraoFaturamento = faturamentoPorCategoria.get('revenda padrão') || 0;
      const foodServiceFaturamento = faturamentoPorCategoria.get('food service') || 0;
      const ufcspaFaturamento = faturamentoPorCategoria.get('ufcspa') || 0;
      const personalizadosFaturamento = faturamentoPorCategoria.get('personalizados') || 0;
      const outrosFaturamento = faturamentoPorCategoria.get('outros') || 0;

      const totalInsumosRevenda = custosInsumosPorCategoria.get('revenda padrão') || 0;
      const totalInsumosFoodService = custosInsumosPorCategoria.get('food service') || 0;

      const totalRevenue = faturamentoPrevisto.faturamentoMensal;
      
      // Calcular custos usando os MESMOS percentuais da "Projeção de Resultados por PDV"
      const custosLogisticos = totalRevenue * (PERCENTUAL_LOGISTICA / 100);
      const impostos = totalRevenue * (PERCENTUAL_IMPOSTOS / 100);
      
      // Aquisição de clientes mantém o cálculo original
      const aquisicaoClientes = totalRevenue * 0.08; // 8%
      
      const totalCustosVariaveis = totalInsumosRevenda + totalInsumosFoodService + custosLogisticos + aquisicaoClientes + impostos;

      const custosFixosDetalhados = custosFixos.map(custo => ({
        name: custo.nome,
        value: convertToMonthlyValue(custo.valor, custo.frequencia)
      }));
      const totalCustosFixos = custosFixosDetalhados.reduce((sum, custo) => sum + custo.value, 0);

      const custosAdministrativosDetalhados = custosVariaveis.map(custo => ({
        name: custo.nome,
        value: convertToMonthlyValue(custo.valor, custo.frequencia)
      }));
      const totalCustosAdministrativos = custosAdministrativosDetalhados.reduce((sum, custo) => sum + custo.value, 0);

      const grossProfit = totalRevenue - totalCustosVariaveis;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const operationalResult = grossProfit - totalCustosFixos - totalCustosAdministrativos;
      const operationalMargin = totalRevenue > 0 ? (operationalResult / totalRevenue) * 100 : 0;

      const totalInvestment = 0;
      const monthlyDepreciation = totalCustosFixos * 0.1;
      const ebitda = operationalResult + monthlyDepreciation;
      const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;
      const breakEvenPoint = grossMargin > 0 ? (totalCustosFixos + totalCustosAdministrativos) / (grossMargin / 100) : 0;
      const paybackMonths = totalInvestment > 0 ? totalInvestment / Math.max(operationalResult, 1) : 0;

      const channelsData: ChannelData[] = [
        {
          channel: 'B2B-Revenda',
          volume: 100,
          revenue: revendaPadraoFaturamento,
          variableCosts: totalInsumosRevenda,
          margin: revendaPadraoFaturamento - totalInsumosRevenda,
          marginPercent: revendaPadraoFaturamento > 0 ? ((revendaPadraoFaturamento - totalInsumosRevenda) / revendaPadraoFaturamento) * 100 : 0
        },
        {
          channel: 'B2B-FoodService',
          volume: 100,
          revenue: foodServiceFaturamento,
          variableCosts: totalInsumosFoodService,
          margin: foodServiceFaturamento - totalInsumosFoodService,
          marginPercent: foodServiceFaturamento > 0 ? ((foodServiceFaturamento - totalInsumosFoodService) / foodServiceFaturamento) * 100 : 0
        }
      ];

      return {
        id: 'base',
        name: 'DRE Base',
        isBase: true,
        createdAt: new Date(),
        channelsData,
        fixedCosts: custosFixosDetalhados,
        administrativeCosts: custosAdministrativosDetalhados,
        investments: [],
        totalRevenue,
        totalVariableCosts: totalCustosVariaveis,
        totalFixedCosts: totalCustosFixos,
        totalAdministrativeCosts: totalCustosAdministrativos,
        totalCosts: totalCustosVariaveis + totalCustosFixos + totalCustosAdministrativos,
        grossProfit,
        grossMargin,
        operationalResult,
        operationalMargin,
        totalInvestment,
        monthlyDepreciation,
        ebitda,
        ebitdaMargin,
        breakEvenPoint,
        paybackMonths,
        detailedBreakdown: {
          revendaPadraoFaturamento,
          foodServiceFaturamento,
          totalInsumosRevenda,
          totalInsumosFoodService,
          totalLogistica: custosLogisticos,
          aquisicaoClientes
        }
      };
    },
    enabled: !!faturamentoPrevisto && !isLoadingFaturamento && clientes.length > 0 && !!indicadores,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000 // 10 minutos
  });

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error?.message
  };
}

// Helper functions
const convertToMonthlyValue = (value: number, frequency: string): number => {
  switch (frequency) {
    case 'semanal': return value * 4;
    case 'trimestral': return value / 3;
    case 'semestral': return value / 6;
    case 'anual': return value / 12;
    case 'mensal':
    default: return value;
  }
};

const getCategoryGroup = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('revenda') || name.includes('padrão')) return 'revenda padrão';
  if (name.includes('food service') || name.includes('foodservice')) return 'food service';
  if (name.includes('ufcspa')) return 'ufcspa';
  if (name.includes('personalizado')) return 'personalizados';
  return 'outros';
};

const calculateInsumoCosts = (faturamento: number, categoryName: string): number => {
  const category = getCategoryGroup(categoryName);
  
  const percentuais = {
    'revenda padrão': 0.31, // 31%
    'food service': 0.42, // 42%
    'ufcspa': 0.42, // 42%
    'personalizados': 0.42, // 42%
    'outros': 0.42 // 42%
  };
  
  return faturamento * (percentuais[category] || 0.42);
};
