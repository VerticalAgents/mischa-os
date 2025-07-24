
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

  // Gerar prefixo do código baseado no ID do cenário
  const getCodePrefix = () => `GF-${scenario.id.slice(0, 8).toUpperCase()}`;
  const codePrefix = getCodePrefix();

  // Apenas os itens de faturamento (sem custos de insumos) + PDVs
  const revendaSubitems = [
    { 
      key: 'revendaPadraoFaturamento', 
      label: 'Revenda Padrão - Faturamento', 
      baseValue: scenario.detailedBreakdown?.revendaPadraoFaturamento || 0,
      code: `${codePrefix}-001`
    },
    { 
      key: 'foodServiceFaturamento', 
      label: 'Food Service - Faturamento', 
      baseValue: scenario.detailedBreakdown?.foodServiceFaturamento || 0,
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
      let variacaoPDVs = 0;
      
      if (growth.type === 'percentage') {
        // Percentual sobre o número base de PDVs (arredondado)
        variacaoPDVs = Math.round(pdvsAtivosBase * (growth.value / 100));
      } else {
        // Valor absoluto - diretamente a quantidade de PDVs a mais ou a menos
        variacaoPDVs = growth.value;
      }
      
      console.log(`📊 [GrowthFactorsSection] Variação de PDVs: ${variacaoPDVs > 0 ? '+' : ''}${variacaoPDVs} PDVs`);
      
      // Calcular variação do faturamento: variação de PDVs × faturamento médio por PDV
      const variacaoFaturamento = variacaoPDVs * faturamentoMedioPDV;
      
      console.log(`💵 [GrowthFactorsSection] Cálculo: ${variacaoPDVs} PDVs × R$ ${faturamentoMedioPDV.toFixed(2)} = R$ ${variacaoFaturamento.toFixed(2)}`);
      
      // Obter valores base do breakdown
      const baseRevendaFaturamento = scenario.detailedBreakdown?.revendaPadraoFaturamento || 0;
      const baseFoodServiceFaturamento = scenario.detailedBreakdown?.foodServiceFaturamento || 0;
      const faturamentoBaseTotal = baseRevendaFaturamento + baseFoodServiceFaturamento;
      
      if (faturamentoBaseTotal > 0) {
        // Calcular proporção atual entre Revenda e Food Service
        const percentualRevenda = baseRevendaFaturamento / faturamentoBaseTotal;
        const percentualFoodService = baseFoodServiceFaturamento / faturamentoBaseTotal;
        
        console.log(`📈 [GrowthFactorsSection] Distribuição atual - Revenda: ${(percentualRevenda * 100).toFixed(1)}%, Food Service: ${(percentualFoodService * 100).toFixed(1)}%`);
        
        // Aplicar variação proporcionalmente aos canais
        const variacaoRevenda = variacaoFaturamento * percentualRevenda;
        const variacaoFoodService = variacaoFaturamento * percentualFoodService;
        
        // Somar/subtrair a variação dos valores base
        updatedBreakdown.revendaPadraoFaturamento = baseRevendaFaturamento + variacaoRevenda;
        updatedBreakdown.foodServiceFaturamento = baseFoodServiceFaturamento + variacaoFoodService;
        
        console.log(`💰 [GrowthFactorsSection] Novos faturamentos - Revenda: R$ ${baseRevendaFaturamento.toFixed(2)} + R$ ${variacaoRevenda.toFixed(2)} = R$ ${updatedBreakdown.revendaPadraoFaturamento.toFixed(2)}`);
        console.log(`💰 [GrowthFactorsSection] Novos faturamentos - Food Service: R$ ${baseFoodServiceFaturamento.toFixed(2)} + R$ ${variacaoFoodService.toFixed(2)} = R$ ${updatedBreakdown.foodServiceFaturamento.toFixed(2)}`);
      } else {
        // Se não há faturamento base, aplicar toda a variação na revenda padrão
        updatedBreakdown.revendaPadraoFaturamento = baseRevendaFaturamento + variacaoFaturamento;
        console.log(`💰 [GrowthFactorsSection] Faturamento base zero, aplicando toda variação na Revenda: R$ ${baseRevendaFaturamento.toFixed(2)} + R$ ${variacaoFaturamento.toFixed(2)} = R$ ${updatedBreakdown.revendaPadraoFaturamento.toFixed(2)}`);
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
      console.log(`🧮 [GrowthFactorsSection] Novos custos de insumos - Revenda: R$ ${baseRevendaInsumos.toFixed(2)} × ${(1 + percentualCrescimentoFaturamento).toFixed(4)} = R$ ${updatedBreakdown.totalInsumosRevenda.toFixed(2)}`);
      console.log(`🧮 [GrowthFactorsSection] Novos custos de insumos - Food Service: R$ ${baseFoodServiceInsumos.toFixed(2)} × ${(1 + percentualCrescimentoFaturamento).toFixed(4)} = R$ ${updatedBreakdown.totalInsumosFoodService.toFixed(2)}`);
      
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
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
    const operationalResult = grossProfit - scenario.totalFixedCosts - scenario.totalAdministrativeCosts;
    const operationalMargin = totalRevenue > 0 ? (operationalResult / totalRevenue * 100) : 0;

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
      <CardContent className="space-y-4">
        {revendaSubitems.map((subitem) => {
          const growth = scenario.channelGrowthFactors?.[subitem.key] || { type: 'absolute', value: 0 };
          const isPDVs = subitem.key === 'pdvsAtivos';
          
          return (
            <div key={subitem.key} className="space-y-2 p-3 border rounded-md">
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
                          ? `Variação: ${growth.value > 0 ? '+' : ''}${Math.round(subitem.baseValue * (growth.value / 100))} PDVs`
                          : `Variação: ${growth.value > 0 ? '+' : ''}${growth.value} PDVs`
                        }
                      </div>
                      <div>
                        Impacto no faturamento: {(() => {
                          const variacaoPDVs = growth.type === 'percentage' 
                            ? Math.round(subitem.baseValue * (growth.value / 100))
                            : growth.value;
                          const impacto = variacaoPDVs * faturamentoMedioPDV;
                          return `${impacto >= 0 ? '+' : ''}R$ ${impacto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        })()}
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
