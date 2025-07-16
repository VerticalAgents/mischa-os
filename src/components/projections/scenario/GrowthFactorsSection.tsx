
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';

interface GrowthFactorsSectionProps {
  scenario: DREData;
}

export function GrowthFactorsSection({ scenario }: GrowthFactorsSectionProps) {
  const { updateScenario } = useProjectionStore();

  // Subitens da Revenda (baseado nos dados reais da DRE)
  const revendaSubitems = [
    { key: 'revendaPadraoFaturamento', label: 'Revenda Padrão - Faturamento', baseValue: scenario.detailedBreakdown?.revendaPadraoFaturamento || 0 },
    { key: 'totalInsumosRevenda', label: 'Revenda Padrão - Insumos', baseValue: scenario.detailedBreakdown?.totalInsumosRevenda || 0 },
    { key: 'foodServiceFaturamento', label: 'Food Service - Faturamento', baseValue: scenario.detailedBreakdown?.foodServiceFaturamento || 0 },
    { key: 'totalInsumosFoodService', label: 'Food Service - Insumos', baseValue: scenario.detailedBreakdown?.totalInsumosFoodService || 0 },
  ];

  const updateGrowthFactor = (subitemKey: string, type: 'percentage' | 'absolute', value: number) => {
    const updatedGrowthFactors = {
      ...scenario.channelGrowthFactors,
      [subitemKey]: { type, value }
    };

    // Recalcular os valores com base nos fatores de crescimento
    const updatedBreakdown = { ...scenario.detailedBreakdown };
    
    revendaSubitems.forEach(subitem => {
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
        <CardTitle className="text-lg">Fatores de Crescimento por Subitem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {revendaSubitems.map((subitem) => {
          const growth = scenario.channelGrowthFactors?.[subitem.key] || { type: 'percentage', value: 0 };
          return (
            <div key={subitem.key} className="space-y-2 p-3 border rounded-md">
              <label className="text-sm font-medium block">
                {subitem.label}
              </label>
              <div className="text-xs text-muted-foreground mb-2">
                Valor base: R$ {subitem.baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                    <SelectItem value="absolute">Absoluto</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={growth.value}
                  onChange={(e) => updateGrowthFactor(subitem.key, growth.type, Number(e.target.value))}
                  className="text-xs"
                  step={growth.type === 'percentage' ? '0.1' : '100'}
                  placeholder={growth.type === 'percentage' ? '0.0%' : '0'}
                />
              </div>
              {growth.value !== 0 && (
                <div className="text-xs text-muted-foreground">
                  Novo valor: R$ {
                    (growth.type === 'percentage' 
                      ? subitem.baseValue * (1 + growth.value / 100)
                      : subitem.baseValue + growth.value
                    ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                  }
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
