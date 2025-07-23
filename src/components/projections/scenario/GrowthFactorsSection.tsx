
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
  const { updateScenario, faturamentoMedioPDV } = useProjectionStore();
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
    console.log(`🔄 [GrowthFactorsSection] Atualizando fator de crescimento: ${subitemKey}, tipo: ${type}, valor: ${value}`);
    console.log(`💰 [GrowthFactorsSection] Faturamento médio por PDV usado: R$ ${faturamentoMedioPDV}`);

    const updatedGrowthFactors = {
      ...scenario.channelGrowthFactors,
      [subitemKey]: { type, value }
    };

    // Recalcular os valores com base nos fatores de crescimento
    const updatedBreakdown = { ...scenario.detailedBreakdown };
    
    // Se for variação de PDVs, usar o faturamento médio da página de projeções
    if (subitemKey === 'pdvsAtivos') {
      const growth = updatedGrowthFactors[subitemKey];
      let novoPDVs = 0;
      
      if (growth.type === 'percentage') {
        // Percentual sobre o número base de PDVs
        const variacaoPDVs = Math.round(pdvsAtivosBase * (growth.value / 100));
        novoPDVs = variacaoPDVs;
      } else {
        // Valor absoluto
        novoPDVs = growth.value;
      }
      
      console.log(`📊 [GrowthFactorsSection] Variação de PDVs calculada: ${novoPDVs} PDVs`);
      
      // Calcular variação do faturamento baseado no faturamento médio por PDV (com 2 casas decimais)
      const variacaoFaturamento = novoPDVs * faturamentoMedioPDV;
      
      console.log(`💵 [GrowthFactorsSection] Variação de faturamento: ${novoPDVs} PDVs × R$ ${faturamentoMedioPDV.toFixed(2)} = R$ ${variacaoFaturamento.toFixed(2)}`);
      
      // Aplicar a variação proporcionalmente aos faturamentos baseado na distribuição atual
      const faturamentoBaseTotal = (scenario.detailedBreakdown?.revendaPadraoFaturamento || 0) + 
                                   (scenario.detailedBreakdown?.foodServiceFaturamento || 0);
      
      if (faturamentoBaseTotal > 0) {
        const percentualRevenda = (scenario.detailedBreakdown?.revendaPadraoFaturamento || 0) / faturamentoBaseTotal;
        const percentualFoodService = (scenario.detailedBreakdown?.foodServiceFaturamento || 0) / faturamentoBaseTotal;
        
        console.log(`📈 [GrowthFactorsSection] Distribuição atual - Revenda: ${(percentualRevenda * 100).toFixed(1)}%, Food Service: ${(percentualFoodService * 100).toFixed(1)}%`);
        
        // Aplicar variação proporcionalmente
        const variacaoRevenda = variacaoFaturamento * percentualRevenda;
        const variacaoFoodService = variacaoFaturamento * percentualFoodService;
        
        updatedBreakdown.revendaPadraoFaturamento = (scenario.detailedBreakdown?.revendaPadraoFaturamento || 0) + variacaoRevenda;
        updatedBreakdown.foodServiceFaturamento = (scenario.detailedBreakdown?.foodServiceFaturamento || 0) + variacaoFoodService;
        
        console.log(`💰 [GrowthFactorsSection] Novos faturamentos - Revenda: R$ ${updatedBreakdown.revendaPadraoFaturamento.toFixed(2)}, Food Service: R$ ${updatedBreakdown.foodServiceFaturamento.toFixed(2)}`);
      } else {
        // Se não há faturamento base, aplicar toda a variação na revenda padrão
        updatedBreakdown.revendaPadraoFaturamento = (scenario.detailedBreakdown?.revendaPadraoFaturamento || 0) + variacaoFaturamento;
        console.log(`💰 [GrowthFactorsSection] Faturamento base zero, aplicando toda variação na Revenda: R$ ${updatedBreakdown.revendaPadraoFaturamento.toFixed(2)}`);
      }
      
      // Calcular o percentual de crescimento do faturamento total para aplicar aos custos
      const novoFaturamentoTotal = updatedBreakdown.revendaPadraoFaturamento + updatedBreakdown.foodServiceFaturamento;
      const percentualCrescimentoFaturamento = faturamentoBaseTotal > 0 ? 
        (novoFaturamentoTotal - faturamentoBaseTotal) / faturamentoBaseTotal : 0;
      
      // Aplicar o mesmo percentual de crescimento aos custos de insumos
      const baseRevendaInsumos = scenario.detailedBreakdown?.totalInsumosRevenda || 0;
      const baseFoodServiceInsumos = scenario.detailedBreakdown?.totalInsumosFoodService || 0;
      
      updatedBreakdown.totalInsumosRevenda = baseRevendaInsumos * (1 + percentualCrescimentoFaturamento);
      updatedBreakdown.totalInsumosFoodService = baseFoodServiceInsumos * (1 + percentualCrescimentoFaturamento);
      
      console.log(`📈 [GrowthFactorsSection] Crescimento do faturamento: ${(percentualCrescimentoFaturamento * 100).toFixed(2)}%`);
      console.log(`🧮 [GrowthFactorsSection] Novos custos de insumos - Revenda: R$ ${updatedBreakdown.totalInsumosRevenda.toFixed(2)}, Food Service: R$ ${updatedBreakdown.totalInsumosFoodService.toFixed(2)}`);
      
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

    console.log(`📊 [GrowthFactorsSection] Totais recalculados - Receita: R$ ${totalRevenue.toFixed(2)}, Lucro Bruto: R$ ${grossProfit.toFixed(2)}`);

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
        {faturamentoMedioPDV > 0 && (
          <p className="text-sm text-muted-foreground">
            Faturamento médio por PDV: R$ {faturamentoMedioPDV.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
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
                  : `Valor base: R$ ${subitem.baseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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
                    <>
                      <div>
                        {growth.type === 'percentage' 
                          ? `Variação: ${Math.round(subitem.baseValue * (growth.value / 100))} PDVs`
                          : `Variação: ${growth.value} PDVs`
                        }
                      </div>
                      <div>
                        Impacto no faturamento: R$ {(
                          (growth.type === 'percentage' 
                            ? Math.round(subitem.baseValue * (growth.value / 100))
                            : growth.value
                          ) * faturamentoMedioPDV
                        ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </>
                  ) : (
                    `Novo valor: R$ ${
                      (growth.type === 'percentage' 
                        ? subitem.baseValue * (1 + growth.value / 100)
                        : subitem.baseValue + growth.value
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
