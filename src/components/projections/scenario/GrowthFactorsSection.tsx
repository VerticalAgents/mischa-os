
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { useClienteStore } from '@/hooks/useClienteStore';

interface GrowthFactorsSectionProps {
  scenario: DREData;
}

export function GrowthFactorsSection({ scenario }: GrowthFactorsSectionProps) {
  const { updateScenario, faturamentoMedioPDV, baseDRE } = useProjectionStore();
  const { clientes } = useClienteStore();

  // Número atual de PDVs ativos
  const pdvsAtivosBase = clientes.filter(c => c.statusCliente === 'Ativo').length;

  // Usar baseDRE do store, ou o próprio scenario se não houver baseDRE ainda
  const baseData = baseDRE || scenario;

  // Gerar prefixo do código baseado no ID do cenário
  const getCodePrefix = () => `GF-${scenario.id.slice(0, 8).toUpperCase()}`;
  const codePrefix = getCodePrefix();

  // Apenas os itens de faturamento (sem custos de insumos) + PDVs
  const revendaSubitems = [
    { 
      key: 'revendaPadraoFaturamento', 
      label: 'Revenda Padrão - Faturamento', 
      baseValue: baseData?.detailedBreakdown?.revendaPadraoFaturamento || 0,
      code: `${codePrefix}-001`
    },
    { 
      key: 'foodServiceFaturamento', 
      label: 'Food Service - Faturamento', 
      baseValue: baseData?.detailedBreakdown?.foodServiceFaturamento || 0,
      code: `${codePrefix}-002`
    },
    { 
      key: 'pdvsAtivos', 
      label: 'PDVs Ativos', 
      baseValue: pdvsAtivosBase,
      code: `${codePrefix}-003`
    },
  ];

  const updateGrowthFactor = (subitemKey: string, type: 'percentage' | 'absolute', value: number) => {
    // Usar baseData ao invés de baseDRE
    if (!baseData || !baseData.detailedBreakdown) {
      console.error('❌ [GrowthFactorsSection] Dados base não encontrados');
      return;
    }

    const updatedGrowthFactors = {
      ...scenario.channelGrowthFactors,
      [subitemKey]: { type, value }
    };

    // Começar sempre com os valores da DRE base
    const updatedBreakdown = {
      revendaPadraoFaturamento: baseData.detailedBreakdown.revendaPadraoFaturamento,
      foodServiceFaturamento: baseData.detailedBreakdown.foodServiceFaturamento,
      totalInsumosRevenda: baseData.detailedBreakdown.totalInsumosRevenda,
      totalInsumosFoodService: baseData.detailedBreakdown.totalInsumosFoodService,
      totalLogistica: baseData.detailedBreakdown.totalLogistica,
      aquisicaoClientes: baseData.detailedBreakdown.aquisicaoClientes
    };

    

    // Aplicar fatores de crescimento APENAS para os subitens específicos
    const revendaFactor = updatedGrowthFactors['revendaPadraoFaturamento'] || { type: 'percentage', value: 0 };
    const foodServiceFactor = updatedGrowthFactors['foodServiceFaturamento'] || { type: 'percentage', value: 0 };
    const pdvsFactor = updatedGrowthFactors['pdvsAtivos'] || { type: 'absolute', value: 0 };

    // Aplicar fator de crescimento para Revenda Padrão
    if (revendaFactor.value !== 0) {
      if (revendaFactor.type === 'percentage') {
        updatedBreakdown.revendaPadraoFaturamento = (baseData.detailedBreakdown.revendaPadraoFaturamento) * (1 + revendaFactor.value / 100);
      } else {
        updatedBreakdown.revendaPadraoFaturamento = revendaFactor.value;
      }
    }

    // Aplicar fator de crescimento para Food Service
    if (foodServiceFactor.value !== 0) {
      if (foodServiceFactor.type === 'percentage') {
        updatedBreakdown.foodServiceFaturamento = (baseData.detailedBreakdown.foodServiceFaturamento) * (1 + foodServiceFactor.value / 100);
      } else {
        updatedBreakdown.foodServiceFaturamento = foodServiceFactor.value;
      }
    }

    // Aplicar variação de PDVs
    if (pdvsFactor.value !== 0) {
      let variacaoPDVs = 0;
      
      if (pdvsFactor.type === 'percentage') {
        variacaoPDVs = Math.round(pdvsAtivosBase * (pdvsFactor.value / 100));
      } else {
        variacaoPDVs = pdvsFactor.value - pdvsAtivosBase;
      }
      
      // Calcular variação do faturamento
      const variacaoFaturamento = variacaoPDVs * faturamentoMedioPDV;
      
      // Distribuir proporcionalmente entre os canais
      const faturamentoBaseTotal = updatedBreakdown.revendaPadraoFaturamento + updatedBreakdown.foodServiceFaturamento;
      
      if (faturamentoBaseTotal > 0) {
        const percentualRevenda = updatedBreakdown.revendaPadraoFaturamento / faturamentoBaseTotal;
        const percentualFoodService = updatedBreakdown.foodServiceFaturamento / faturamentoBaseTotal;
        
        const variacaoRevenda = variacaoFaturamento * percentualRevenda;
        const variacaoFoodService = variacaoFaturamento * percentualFoodService;
        
        updatedBreakdown.revendaPadraoFaturamento += variacaoRevenda;
        updatedBreakdown.foodServiceFaturamento += variacaoFoodService;
      } else {
        updatedBreakdown.revendaPadraoFaturamento += variacaoFaturamento;
      }
    }

    // Recalcular custos de insumos proporcionalmente
    const baseRevendaFaturamento = baseData.detailedBreakdown.revendaPadraoFaturamento;
    const baseFoodServiceFaturamento = baseData.detailedBreakdown.foodServiceFaturamento;
    const baseRevendaInsumos = baseData.detailedBreakdown.totalInsumosRevenda;
    const baseFoodServiceInsumos = baseData.detailedBreakdown.totalInsumosFoodService;

    if (baseRevendaFaturamento > 0) {
      const revendaGrowthFactor = updatedBreakdown.revendaPadraoFaturamento / baseRevendaFaturamento;
      updatedBreakdown.totalInsumosRevenda = baseRevendaInsumos * revendaGrowthFactor;
    }

    if (baseFoodServiceFaturamento > 0) {
      const foodServiceGrowthFactor = updatedBreakdown.foodServiceFaturamento / baseFoodServiceFaturamento;
      updatedBreakdown.totalInsumosFoodService = baseFoodServiceInsumos * foodServiceGrowthFactor;
    }

    // Recalcular totais
    const totalRevenue = updatedBreakdown.revendaPadraoFaturamento + updatedBreakdown.foodServiceFaturamento;
    
    // Custos variáveis = APENAS insumos (não incluir logística nem aquisição)
    const totalVariableCosts = updatedBreakdown.totalInsumosRevenda + updatedBreakdown.totalInsumosFoodService;
    
    const grossProfit = totalRevenue - totalVariableCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
    
    // Recalcular custos administrativos proporcionalmente ao faturamento
    const faturamentoGrowthFactor = baseData.totalRevenue > 0 ? totalRevenue / baseData.totalRevenue : 1;
    
    const updatedAdministrativeCosts = scenario.administrativeCosts.map(cost => ({
      ...cost,
      value: cost.isPercentage 
        ? (cost.value / baseData.totalRevenue) * totalRevenue
        : cost.value
    }));
    
    const totalAdministrativeCosts = updatedAdministrativeCosts.reduce((sum, c) => sum + c.value, 0);
    
    // Atualizar logística e aquisição no breakdown
    updatedBreakdown.totalLogistica = updatedAdministrativeCosts.find(c => c.name === 'Logística')?.value || 0;
    updatedBreakdown.aquisicaoClientes = 0; // Não temos este dado ainda
    
    const operationalResult = grossProfit - scenario.totalFixedCosts - totalAdministrativeCosts;
    const operationalMargin = totalRevenue > 0 ? (operationalResult / totalRevenue * 100) : 0;
    
    // Atualizar channelsData também
    const updatedChannelsData = baseData.channelsData.map(channel => {
      if (channel.channel === 'B2B-Revenda') {
        const newRevenue = updatedBreakdown.revendaPadraoFaturamento;
        const newVariableCosts = updatedBreakdown.totalInsumosRevenda;
        return {
          ...channel,
          revenue: newRevenue,
          variableCosts: newVariableCosts,
          margin: newRevenue - newVariableCosts,
          marginPercent: newRevenue > 0 ? ((newRevenue - newVariableCosts) / newRevenue) * 100 : 0
        };
      }
      if (channel.channel === 'B2B-FoodService') {
        const newRevenue = updatedBreakdown.foodServiceFaturamento;
        const newVariableCosts = updatedBreakdown.totalInsumosFoodService;
        return {
          ...channel,
          revenue: newRevenue,
          variableCosts: newVariableCosts,
          margin: newRevenue - newVariableCosts,
          marginPercent: newRevenue > 0 ? ((newRevenue - newVariableCosts) / newRevenue) * 100 : 0
        };
      }
      return channel;
    });
    
    const ebitda = operationalResult + scenario.monthlyDepreciation;
    const ebitdaMargin = totalRevenue > 0 ? (ebitda / totalRevenue) * 100 : 0;

    updateScenario(scenario.id, {
      channelGrowthFactors: updatedGrowthFactors,
      detailedBreakdown: updatedBreakdown,
      channelsData: updatedChannelsData,
      totalRevenue,
      totalVariableCosts,
      administrativeCosts: updatedAdministrativeCosts,
      totalAdministrativeCosts,
      grossProfit,
      grossMargin,
      operationalResult,
      operationalMargin,
      ebitda,
      ebitdaMargin
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <span>Fatores de Crescimento</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{codePrefix}</span>
        </CardTitle>
        {faturamentoMedioPDV > 0 && (
          <p className="text-sm text-muted-foreground">
            <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-1 rounded mr-2">{codePrefix}-000</span>
            Faturamento médio por PDV (Revenda Padrão): R$ {faturamentoMedioPDV.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {revendaSubitems.map((subitem) => {
          const growth = scenario.channelGrowthFactors?.[subitem.key] || { type: 'absolute', value: 0 };
          const isPDVs = subitem.key === 'pdvsAtivos';
          
          // Calcular o novo valor para exibição
          let novoValor = subitem.baseValue;
          if (growth.value !== 0) {
            if (growth.type === 'percentage') {
              novoValor = subitem.baseValue * (1 + growth.value / 100);
            } else {
              // Para absoluto, o novo valor É o valor absoluto
              novoValor = growth.value;
            }
          }
          
          return (
            <div key={subitem.key} className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <label className="text-sm font-medium block flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-blue-50 px-2 py-1 rounded">{subitem.code}</span>
                <span>{subitem.label}</span>
              </label>
              <div className="text-xs text-muted-foreground mb-2">
                {isPDVs 
                  ? `PDVs ativos atuais: ${subitem.baseValue}`
                  : `Valor base: R$ ${subitem.baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  value={growth.type}
                  onValueChange={(value: 'percentage' | 'absolute') => 
                    updateGrowthFactor(subitem.key, value, growth.value)
                  }
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">%</SelectItem>
                    <SelectItem value="absolute">{isPDVs ? 'PDVs' : 'Absoluto'}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={growth.value}
                  onChange={(e) => updateGrowthFactor(subitem.key, growth.type, Number(e.target.value))}
                  className="text-xs"
                  step={growth.type === 'percentage' ? '0.1' : isPDVs ? '1' : '100'}
                  placeholder={growth.type === 'percentage' ? '0.0%' : isPDVs ? '0 PDVs' : '0'}
                />
              </div>
              {growth.value !== 0 && (
                <div className="text-xs text-muted-foreground">
                  {isPDVs ? (
                    <>
                      <div>
                        {growth.type === 'percentage' 
                          ? `Variação: ${growth.value > 0 ? '+' : ''}${Math.round(subitem.baseValue * (growth.value / 100))} PDVs`
                          : `Novo total: ${growth.value} PDVs (${growth.value - subitem.baseValue > 0 ? '+' : ''}${growth.value - subitem.baseValue} PDVs)`
                        }
                      </div>
                      <div>
                        Impacto no faturamento: {(() => {
                          const variacaoPDVs = growth.type === 'percentage' 
                            ? Math.round(subitem.baseValue * (growth.value / 100))
                            : (growth.value - subitem.baseValue);
                          const impacto = variacaoPDVs * faturamentoMedioPDV;
                          return `${impacto >= 0 ? '+' : ''}R$ ${impacto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        })()}
                      </div>
                    </>
                  ) : (
                    `Novo valor: R$ ${novoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
