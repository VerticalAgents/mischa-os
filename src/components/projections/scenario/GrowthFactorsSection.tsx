
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
  const { updateScenario } = useProjectionStore();
  const { clientes } = useClienteStore();

  // Número atual de PDVs ativos
  const pdvsAtivosBase = clientes.filter(c => c.statusCliente === 'Ativo').length;

  // Apenas os itens de faturamento (sem custos de insumos) + PDVs
  const revendaSubitems = [
    { key: 'revendaPadraoFaturamento', label: 'Revenda Padrão - Faturamento', baseValue: scenario.detailedBreakdown?.revendaPadraoFaturamento || 0 },
    { key: 'foodServiceFaturamento', label: 'Food Service - Faturamento', baseValue: scenario.detailedBreakdown?.foodServiceFaturamento || 0 },
    { key: 'pdvsAtivos', label: 'PDVs Ativos', baseValue: pdvsAtivosBase },
  ];

  const updateGrowthFactor = (subitemKey: string, type: 'percentage' | 'absolute', value: number) => {
    const updatedGrowthFactors = {
      ...scenario.channelGrowthFactors,
      [subitemKey]: { type, value }
    };

    // Recalcular os valores com base nos fatores de crescimento
    const updatedBreakdown = { ...scenario.detailedBreakdown };
    
    // Se for variação de PDVs, calcular o impacto proporcional no faturamento
    if (subitemKey === 'pdvsAtivos') {
      const growth = updatedGrowthFactors[subitemKey];
      let novoNumeroPDVs = pdvsAtivosBase;
      
      if (growth.type === 'percentage') {
        novoNumeroPDVs = Math.round(pdvsAtivosBase * (1 + growth.value / 100));
      } else {
        novoNumeroPDVs = pdvsAtivosBase + growth.value;
      }
      
      // Calcular fator de crescimento baseado na variação de PDVs
      const fatorCrescimentoPDV = novoNumeroPDVs / pdvsAtivosBase;
      
      // Aplicar o fator proporcionalmente aos faturamentos
      const baseRevendaFaturamento = scenario.detailedBreakdown?.revendaPadraoFaturamento || 0;
      const baseFoodServiceFaturamento = scenario.detailedBreakdown?.foodServiceFaturamento || 0;
      
      updatedBreakdown.revendaPadraoFaturamento = baseRevendaFaturamento * fatorCrescimentoPDV;
      updatedBreakdown.foodServiceFaturamento = baseFoodServiceFaturamento * fatorCrescimentoPDV;
      
      // Aplicar também aos custos de insumos proporcionalmente
      const baseRevendaInsumos = scenario.detailedBreakdown?.totalInsumosRevenda || 0;
      const baseFoodServiceInsumos = scenario.detailedBreakdown?.totalInsumosFoodService || 0;
      
      updatedBreakdown.totalInsumosRevenda = baseRevendaInsumos * fatorCrescimentoPDV;
      updatedBreakdown.totalInsumosFoodService = baseFoodServiceInsumos * fatorCrescimentoPDV;
      
    } else {
      // Calcular os novos valores de faturamento para outros itens
      revendaSubitems.forEach(subitem => {
        if (subitem.key === 'pdvsAtivos') return; // Skip PDV calculation here
        
        const growth = updatedGrowthFactors[subitem.key];
        if (growth) {
          let newValue = subitem.baseValue;
          if (growth.type === 'percentage') {
            newValue = subitem.baseValue * (1 + growth.value / 100);
          } else {
            newValue = subitem.baseValue + growth.value;
          }
          updatedBreakdown[subitem.key as keyof typeof updatedBreakdown] = newValue;
        }
      });

      // Calcular proporcionalmente os custos de insumos baseados no crescimento do faturamento
      const baseRevendaFaturamento = scenario.detailedBreakdown?.revendaPadraoFaturamento || 0;
      const baseFoodServiceFaturamento = scenario.detailedBreakdown?.foodServiceFaturamento || 0;
      const baseRevendaInsumos = scenario.detailedBreakdown?.totalInsumosRevenda || 0;
      const baseFoodServiceInsumos = scenario.detailedBreakdown?.totalInsumosFoodService || 0;

      // Calcular o fator de crescimento proporcional para cada canal
      if (baseRevendaFaturamento > 0) {
        const revendaGrowthFactor = updatedBreakdown.revendaPadraoFaturamento / baseRevendaFaturamento;
        updatedBreakdown.totalInsumosRevenda = baseRevendaInsumos * revendaGrowthFactor;
      }

      if (baseFoodServiceFaturamento > 0) {
        const foodServiceGrowthFactor = updatedBreakdown.foodServiceFaturamento / baseFoodServiceFaturamento;
        updatedBreakdown.totalInsumosFoodService = baseFoodServiceInsumos * foodServiceGrowthFactor;
      }
    }

    // Recalcular totais
    const totalRevenue = updatedBreakdown.revendaPadraoFaturamento + updatedBreakdown.foodServiceFaturamento;
    const totalVariableCosts = updatedBreakdown.totalInsumosRevenda + updatedBreakdown.totalInsumosFoodService + updatedBreakdown.totalLogistica + updatedBreakdown.aquisicaoClientes;
    const grossProfit = totalRevenue - totalVariableCosts;
    const grossMargin = grossProfit / totalRevenue * 100;
    const operationalResult = grossProfit - scenario.totalFixedCosts - scenario.totalAdministrativeCosts;
    const operationalMargin = operationalResult / totalRevenue * 100;

    updateScenario(scenario.id, {
      channelGrowthFactors: updatedGrowthFactors,
      detailedBreakdown: updatedBreakdown,
      totalRevenue,
      totalVariableCosts,
      grossProfit,
      grossMargin,
      operationalResult,
      operationalMargin
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fatores de Crescimento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {revendaSubitems.map((subitem) => {
          const growth = scenario.channelGrowthFactors?.[subitem.key] || { type: 'percentage', value: 0 };
          const isPDVs = subitem.key === 'pdvsAtivos';
          
          return (
            <div key={subitem.key} className="space-y-2 p-3 border rounded-md">
              <label className="text-sm font-medium block">
                {subitem.label}
              </label>
              <div className="text-xs text-muted-foreground mb-2">
                {isPDVs 
                  ? `PDVs ativos atuais: ${subitem.baseValue}`
                  : `Valor base: R$ ${subitem.baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                }
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                    `Novo total: ${
                      growth.type === 'percentage' 
                        ? Math.round(subitem.baseValue * (1 + growth.value / 100))
                        : subitem.baseValue + growth.value
                    } PDVs`
                  ) : (
                    `Novo valor: R$ ${
                      (growth.type === 'percentage' 
                        ? subitem.baseValue * (1 + growth.value / 100)
                        : subitem.baseValue + growth.value
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                    }`
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
