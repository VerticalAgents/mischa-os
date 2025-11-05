import { useQuery } from "@tanstack/react-query";
import { DREData, ChannelData, CostItem, InvestmentItem } from "@/types/projections";
import { useIndicadoresFinanceiros } from "./useIndicadoresFinanceiros";
import { useSupabaseCustosFixos } from "./useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis } from "./useSupabaseCustosVariaveis";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

const convertToMonthlyValue = (value: number, frequency: string): number => {
  const multipliers: Record<string, number> = {
    'diario': 30,
    'semanal': 4.33,
    'mensal': 1,
    'trimestral': 1 / 3,
    'semestral': 1 / 6,
    'anual': 1 / 12,
  };
  
  return value * (multipliers[frequency.toLowerCase()] || 1);
};

export const useDREDataFromIndicadores = (useRealPercentages: boolean = false) => {
  const { indicadores, loading: loadingIndicadores } = useIndicadoresFinanceiros('mes-passado');
  const { custosFixos, isLoading: loadingFixos } = useSupabaseCustosFixos();
  const { custosVariaveis, isLoading: loadingVariaveis } = useSupabaseCustosVariaveis();

  return useQuery({
    queryKey: ['dre-from-indicadores', indicadores, custosFixos, custosVariaveis, useRealPercentages],
    queryFn: async (): Promise<DREData> => {
      if (!indicadores) {
        throw new Error('Indicadores não disponíveis');
      }

      // Construir channelsData a partir das categorias dos indicadores
      const channelsData: ChannelData[] = [];
      
      // Mapear categorias para channels
      const categoryToChannel: Record<string, string> = {
        'revenda padrão': 'B2B-Revenda',
        'food service': 'B2B-FoodService',
        'ufcspa': 'B2C-UFCSPA',
        'personalizados': 'B2C-Personalizados',
      };

      // Processar cada categoria dos indicadores
      indicadores.custoMedioPorCategoria.forEach((custoCategoria) => {
        const faturamentoCategoria = indicadores.precoMedioPorCategoria.find(
          p => p.categoriaId === custoCategoria.categoriaId
        );

        if (!faturamentoCategoria) return;

        const channelName = categoryToChannel[custoCategoria.categoriaNome.toLowerCase()] || 'B2C-Outros';
        
        const revenue = faturamentoCategoria.faturamentoTotal;
        const volume = custoCategoria.volumeTotal;
        const variableCosts = custoCategoria.custoTotal;
        const margin = revenue - variableCosts;
        const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

        channelsData.push({
          channel: channelName as any,
          volume,
          revenue,
          variableCosts,
          margin,
          marginPercent,
        });
      });

      // Calcular totais de receita e custos variáveis
      const totalRevenue = channelsData.reduce((sum, ch) => sum + ch.revenue, 0);
      const totalVariableCosts = channelsData.reduce((sum, ch) => sum + ch.variableCosts, 0);

      // Processar custos fixos
      const fixedCosts: CostItem[] = custosFixos.map(custo => ({
        name: custo.nome,
        value: convertToMonthlyValue(Number(custo.valor), custo.frequencia),
        isPercentage: false,
      }));

      const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.value, 0);

      // Calcular taxa de boleto baseada em entregas reais
      // 1. Buscar clientes que pagam via boleto
      const { data: clientesBoleto, error: errorClientes } = await supabase
        .from('clientes')
        .select('id')
        .eq('forma_pagamento', 'Boleto')
        .eq('ativo', true);

      if (errorClientes) {
        console.error('Erro ao buscar clientes com boleto:', errorClientes);
      }

      let taxaBoletoValue = 0;
      if (clientesBoleto && clientesBoleto.length > 0) {
        // 2. Buscar entregas do mês passado para esses clientes
        const mesPassado = subMonths(new Date(), 1);
        const inicioMesPassado = startOfMonth(mesPassado);
        const fimMesPassado = endOfMonth(mesPassado);

        const clientesBoletoIds = clientesBoleto.map(c => c.id);

        const { data: entregas, error: errorEntregas } = await supabase
          .from('historico_entregas')
          .select('id')
          .eq('tipo', 'entrega')
          .in('cliente_id', clientesBoletoIds)
          .gte('data', inicioMesPassado.toISOString())
          .lte('data', fimMesPassado.toISOString());

        if (errorEntregas) {
          console.error('Erro ao buscar entregas de boleto:', errorEntregas);
        }

        if (entregas && entregas.length > 0) {
          // 3. Calcular: número de entregas × R$ 2,19
          const numeroEntregas = entregas.length;
          taxaBoletoValue = numeroEntregas * 2.19;
        }
      }

      // Processar custos administrativos (custos variáveis)
      let administrativeCosts: CostItem[] = [];
      
      if (useRealPercentages) {
        // Usar percentuais reais das projeções de PDV
        const logisticaPercentual = custosVariaveis.find(c => c.nome.toLowerCase().includes('logistica') || c.nome.toLowerCase().includes('logística'))?.percentual_faturamento || 0;
        const impostoPercentual = custosVariaveis.find(c => c.nome.toLowerCase().includes('imposto'))?.percentual_faturamento || 0;
        
        administrativeCosts = [
          {
            name: 'Logística',
            value: (totalRevenue * Number(logisticaPercentual) / 100),
            isPercentage: true,
          },
          {
            name: 'Imposto',
            value: (totalRevenue * Number(impostoPercentual) / 100),
            isPercentage: true,
          },
          {
            name: 'Taxa Boleto',
            value: taxaBoletoValue,
            isPercentage: true,
          }
        ];
      } else {
        // Usar custos cadastrados normalmente
        administrativeCosts = custosVariaveis.map(custo => {
          const isPercentage = Number(custo.percentual_faturamento) > 0;
          const value = isPercentage 
            ? (totalRevenue * Number(custo.percentual_faturamento) / 100)
            : convertToMonthlyValue(Number(custo.valor), custo.frequencia);

          return {
            name: custo.nome,
            value,
            isPercentage,
          };
        });

        // Adicionar Taxa Boleto sempre
        administrativeCosts.push({
          name: 'Taxa Boleto',
          value: taxaBoletoValue,
          isPercentage: true,
        });
      }

      const totalAdministrativeCosts = administrativeCosts.reduce((sum, cost) => sum + cost.value, 0);

      // Calcular investimentos e depreciação (valores padrão por enquanto)
      const investments: InvestmentItem[] = [];
      const totalInvestment = 0;
      const monthlyDepreciation = 0;

      // Cálculos financeiros
      const totalCosts = totalVariableCosts + totalFixedCosts + totalAdministrativeCosts;
      const grossProfit = totalRevenue - totalVariableCosts;
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
      const operationalResult = grossProfit - totalFixedCosts - totalAdministrativeCosts;
      const operationalMargin = totalRevenue > 0 ? (operationalResult / totalRevenue) * 100 : 0;
      const ebitda = operationalResult + monthlyDepreciation;
      const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

      // Ponto de equilíbrio
      const contributionMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
      const breakEvenPoint = contributionMargin > 0 
        ? (totalFixedCosts + totalAdministrativeCosts) / contributionMargin 
        : 0;

      // Payback
      const paybackMonths = operationalResult > 0 
        ? totalInvestment / operationalResult 
        : 0;

      // Criar detailedBreakdown com base nos channelsData
      const revendaChannel = channelsData.find(ch => ch.channel === 'B2B-Revenda');
      const foodServiceChannel = channelsData.find(ch => ch.channel === 'B2B-FoodService');

      const detailedBreakdown = {
        revendaPadraoFaturamento: revendaChannel?.revenue || 0,
        foodServiceFaturamento: foodServiceChannel?.revenue || 0,
        totalInsumosRevenda: revendaChannel?.variableCosts || 0,
        totalInsumosFoodService: foodServiceChannel?.variableCosts || 0,
        totalLogistica: administrativeCosts.find(c => c.name === 'Logística')?.value || 0,
        aquisicaoClientes: 0, // Não temos este dado ainda
      };

      console.log('✅ [useDREDataFromIndicadores] DRE calculada com sucesso:', {
        totalRevenue,
        totalVariableCosts,
        totalFixedCosts,
        totalAdministrativeCosts,
        ebitda,
        breakEvenPoint,
        paybackMonths,
        detailedBreakdown
      });

      return {
        id: 'base',
        name: 'DRE Base',
        isBase: true,
        createdAt: new Date(),
        channelsData,
        fixedCosts,
        administrativeCosts,
        investments,
        totalRevenue,
        totalVariableCosts,
        totalFixedCosts,
        totalAdministrativeCosts,
        totalCosts,
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
        detailedBreakdown
      };
    },
    enabled: !loadingIndicadores && !loadingFixos && !loadingVariaveis && !!indicadores,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
