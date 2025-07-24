
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

  // Gerar prefixo do código baseado no ID do cenário
  const getCodePrefix = () => `GF-${scenario.id.slice(0, 8).toUpperCase()}`;
  const codePrefix = getCodePrefix();

  // Apenas os itens de faturamento (sem custos de insumos) + PDVs
  const revendaSubitems = [
    { 
      key: 'revendaPadraoFaturamento', 
      label: 'Revenda Padrão - Faturamento', 
      baseValue: baseDRE?.detailedBreakdown?.revendaPadraoFaturamento || 0,
      code: `${codePrefix}-001`
    },
    { 
      key: 'foodServiceFaturamento', 
      label: 'Food Service - Faturamento', 
      baseValue: baseDRE?.detailedBreakdown?.foodServiceFaturamento || 0,
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

    if (!baseDRE) {
      console.error('❌ [GrowthFactorsSection] DRE Base não encontrada');
      return;
    }

    const updatedGrowthFactors = {
      ...scenario.channelGrowthFactors,
      [subitemKey]: { type, value }
    };

    // Começar sempre com os valores da DRE base
    const updatedBreakdown = {
      revendaPadraoFaturamento: baseDRE.detailedBreakdown?.revendaPadraoFaturamento || 0,
      foodServiceFaturamento: baseDRE.detailedBreakdown?.foodServiceFaturamento || 0,
      totalInsumosRevenda: baseDRE.detailedBreakdown?.totalInsumosRevenda || 0,
      totalInsumosFoodService: baseDRE.detailedBreakdown?.totalInsumosFoodService || 0,
      totalLogistica: baseDRE.detailedBreakdown?.totalLogistica || 0,
      aquisicaoClientes: baseDRE.detailedBreakdown?.aquisicaoClientes || 0
    };

    console.log(`📊 [GrowthFactorsSection] Valores base carregados:`, updatedBreakdown);

    // Aplicar todos os fatores de crescimento sobre os valores base
    const allFactors = updatedGrowthFactors;
    
    // Aplicar fatores de crescimento direto nos faturamentos
    const revendaFactor = allFactors['revendaPadraoFaturamento'] || { type: 'percentage', value: 0 };
    const foodServiceFactor = allFactors['foodServiceFaturamento'] || { type: 'percentage', value: 0 };
    const pdvsFactor = allFactors['pdvsAtivos'] || { type: 'absolute', value: 0 };

    // Calcular novos faturamentos
    if (revendaFactor.value !== 0) {
      if (revendaFactor.type === 'percentage') {
        updatedBreakdown.revendaPadraoFaturamento = updatedBreakdown.revendaPadraoFaturamento * (1 + revendaFactor.value / 100);
      } else {
        updatedBreakdown.revendaPadraoFaturamento = updatedBreakdown.revendaPadraoFaturamento + revendaFactor.value;
      }
    }

    if (foodServiceFactor.value !== 0) {
      if (foodServiceFactor.type === 'percentage') {
        updatedBreakdown.foodServiceFaturamento = updatedBreakdown.foodServiceFaturamento * (1 + foodServiceFactor.value / 100);
      } else {
        updatedBreakdown.foodServiceFaturamento = updatedBreakdown.foodServiceFaturamento + foodServiceFactor.value;
      }
    }

    // Aplicar variação de PDVs
    if (pdvsFactor.value !== 0) {
      let variacaoPDVs = 0;
      
      if (pdvsFactor.type === 'percentage') {
        variacaoPDVs = Math.round(pdvsAtivosBase * (pdvsFactor.value / 100));
      } else {
        variacaoPDVs = pdvsFactor.value;
      }
      
      console.log(`📊 [GrowthFactorsSection] Variação de PDVs: ${variacaoPDVs > 0 ? '+' : ''}${variacaoPDVs} PDVs`);
      
      // Calcular variação do faturamento
      const variacaoFaturamento = variacaoPDVs * faturamentoMedioPDV;
      
      console.log(`💵 [GrowthFactorsSection] Cálculo: ${variacaoPDVs} PDVs × R$ ${faturamentoMedioPDV.toFixed(2)} = R$ ${variacaoFaturamento.toFixed(2)}`);
      
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
    const baseRevendaFaturamento = baseDRE.detailedBreakdown?.revendaPadraoFaturamento || 0;
    const baseFoodServiceFaturamento = baseDRE.detailedBreakdown?.foodServiceFaturamento || 0;
    const baseRevendaInsumos = baseDRE.detailedBreakdown?.totalInsumosRevenda || 0;
    const baseFoodServiceInsumos = baseDRE.detailedBreakdown?.totalInsumosFoodService || 0;

    if (baseRevendaFaturamento > 0) {
      const revendaGrowthFactor = updatedBreakdown.revendaPadraoFaturamento / baseRevendaFaturamento;
      updatedBreakdown.totalInsumosRevenda = baseRevendaInsumos * revendaGrowthFactor;
    }

    if (baseFoodServiceFaturamento > 0) {
      const foodServiceGrowthFactor = updatedBreakdown.foodServiceFaturamento / baseFoodServiceFaturamento;
      updatedBreakdown.totalInsumosFoodService = baseFoodServiceInsumos * foodServiceGrowthFactor;
    }

    // Recalcular logística e aquisição proporcionalmente ao faturamento total
    const novoTotalFaturamento = updatedBreakdown.revendaPadraoFaturamento + updatedBreakdown.foodServiceFaturamento;
    const faturamentoGrowthFactor = baseDRE.totalRevenue > 0 ? novoTotalFaturamento / baseDRE.totalRevenue : 1;
    
    updatedBreakdown.totalLogistica = (baseDRE.detailedBreakdown?.totalLogistica || 0) * faturamentoGrowthFactor;
    updatedBreakdown.aquisicaoClientes = (baseDRE.detailedBreakdown?.aquisicaoClientes || 0) * faturamentoGrowthFactor;

    // Recalcular totais
    const totalRevenue = updatedBreakdown.revendaPadraoFaturamento + updatedBreakdown.foodServiceFaturamento;
    const totalVariableCosts = updatedBreakdown.totalInsumosRevenda + updatedBreakdown.totalInsumosFoodService + updatedBreakdown.totalLogistica + updatedBreakdown.aquisicaoClientes;
    const grossProfit = totalRevenue - totalVariableCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;
    const operationalResult = grossProfit - scenario.totalFixedCosts - scenario.totalAdministrativeCosts;
    const operationalMargin = totalRevenue > 0 ? (operationalResult / totalRevenue * 100) : 0;

    console.log(`📊 [GrowthFactorsSection] Novos valores calculados:`, {
      totalRevenue,
      totalVariableCosts,
      grossProfit,
      grossMargin
    });

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
