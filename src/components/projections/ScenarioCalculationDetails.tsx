
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';

interface ScenarioCalculationDetailsProps {
  scenario: DREData;
}

export function ScenarioCalculationDetails({ scenario }: ScenarioCalculationDetailsProps) {
  const { baseDRE, faturamentoMedioPDV } = useProjectionStore();
  
  if (!baseDRE || scenario.isBase) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value/100);
  };

  const getCodePrefix = () => `CALC-${scenario.id.slice(0, 8).toUpperCase()}`;
  const codePrefix = getCodePrefix();

  // Obter fatores de crescimento
  const revendaFactor = scenario.channelGrowthFactors?.['revendaPadraoFaturamento'] || { type: 'percentage', value: 0 };
  const foodServiceFactor = scenario.channelGrowthFactors?.['foodServiceFaturamento'] || { type: 'percentage', value: 0 };
  const pdvsFactor = scenario.channelGrowthFactors?.['pdvsAtivos'] || { type: 'absolute', value: 0 };

  // Calcular valores base
  const baseRevendaFaturamento = baseDRE.detailedBreakdown?.revendaPadraoFaturamento || 0;
  const baseFoodServiceFaturamento = baseDRE.detailedBreakdown?.foodServiceFaturamento || 0;
  const baseInsumosRevenda = baseDRE.detailedBreakdown?.totalInsumosRevenda || 0;
  const baseInsumosFoodService = baseDRE.detailedBreakdown?.totalInsumosFoodService || 0;
  const baseLogistica = baseDRE.detailedBreakdown?.totalLogistica || 0;
  const baseAquisicaoClientes = baseDRE.detailedBreakdown?.aquisicaoClientes || 0;

  // Calcular novos valores baseados nos fatores
  const novoRevendaFaturamento = revendaFactor.type === 'percentage' 
    ? baseRevendaFaturamento * (1 + revendaFactor.value / 100)
    : baseRevendaFaturamento + revendaFactor.value;
    
  const novoFoodServiceFaturamento = foodServiceFactor.type === 'percentage'
    ? baseFoodServiceFaturamento * (1 + foodServiceFactor.value / 100)
    : baseFoodServiceFaturamento + foodServiceFactor.value;

  // Calcular proporções dos insumos
  const proporcaoRevendaInsumos = baseRevendaFaturamento > 0 ? baseInsumosRevenda / baseRevendaFaturamento : 0;
  const proporcaoFoodServiceInsumos = baseFoodServiceFaturamento > 0 ? baseInsumosFoodService / baseFoodServiceFaturamento : 0;

  const novosInsumosRevenda = novoRevendaFaturamento * proporcaoRevendaInsumos;
  const novosInsumosFoodService = novoFoodServiceFaturamento * proporcaoFoodServiceInsumos;

  const novoTotalFaturamento = novoRevendaFaturamento + novoFoodServiceFaturamento;
  const proporcaoLogistica = baseDRE.totalRevenue > 0 ? baseLogistica / baseDRE.totalRevenue : 0;
  const proporcaoAquisicao = baseDRE.totalRevenue > 0 ? baseAquisicaoClientes / baseDRE.totalRevenue : 0;

  const novaLogistica = novoTotalFaturamento * proporcaoLogistica;
  const novaAquisicaoClientes = novoTotalFaturamento * proporcaoAquisicao;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Fatores de Crescimento</span>
            <Badge variant="outline">{codePrefix}-FACTORS</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{codePrefix}-F001</span>
                <span className="font-medium">Revenda Padrão</span>
              </div>
              <div className="text-sm space-y-1">
                <p>Tipo: {revendaFactor.type === 'percentage' ? 'Percentual' : 'Absoluto'}</p>
                <p>Valor: {revendaFactor.type === 'percentage' ? `${revendaFactor.value}%` : formatCurrency(revendaFactor.value)}</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{codePrefix}-F002</span>
                <span className="font-medium">Food Service</span>
              </div>
              <div className="text-sm space-y-1">
                <p>Tipo: {foodServiceFactor.type === 'percentage' ? 'Percentual' : 'Absoluto'}</p>
                <p>Valor: {foodServiceFactor.type === 'percentage' ? `${foodServiceFactor.value}%` : formatCurrency(foodServiceFactor.value)}</p>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">{codePrefix}-F003</span>
                <span className="font-medium">PDVs Ativos</span>
              </div>
              <div className="text-sm space-y-1">
                <p>Tipo: {pdvsFactor.type === 'percentage' ? 'Percentual' : 'Absoluto'}</p>
                <p>Valor: {pdvsFactor.type === 'percentage' ? `${pdvsFactor.value}%` : `${pdvsFactor.value} PDVs`}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Detalhamento dos Cálculos - Receita Operacional</span>
            <Badge variant="outline">{codePrefix}-REVENUE</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Revenda Padrão */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-R001</span>
                <span className="font-medium">Cálculo Revenda Padrão</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Valor Base:</p>
                  <p>{formatCurrency(baseRevendaFaturamento)}</p>
                </div>
                <div>
                  <p className="font-medium">Fator Aplicado:</p>
                  <p>{revendaFactor.type === 'percentage' ? 
                    `${baseRevendaFaturamento.toFixed(2)} × (1 + ${revendaFactor.value}%)` : 
                    `${baseRevendaFaturamento.toFixed(2)} + ${revendaFactor.value.toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Resultado:</p>
                  <p className="text-lg font-bold">{formatCurrency(novoRevendaFaturamento)}</p>
                </div>
              </div>
            </div>

            {/* Food Service */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-R002</span>
                <span className="font-medium">Cálculo Food Service</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Valor Base:</p>
                  <p>{formatCurrency(baseFoodServiceFaturamento)}</p>
                </div>
                <div>
                  <p className="font-medium">Fator Aplicado:</p>
                  <p>{foodServiceFactor.type === 'percentage' ? 
                    `${baseFoodServiceFaturamento.toFixed(2)} × (1 + ${foodServiceFactor.value}%)` : 
                    `${baseFoodServiceFaturamento.toFixed(2)} + ${foodServiceFactor.value.toFixed(2)}`}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Resultado:</p>
                  <p className="text-lg font-bold">{formatCurrency(novoFoodServiceFaturamento)}</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-R003</span>
                <span className="font-medium">Total Receita Operacional</span>
              </div>
              <div className="text-sm">
                <p className="mb-2">
                  <span className="font-medium">Cálculo:</span> 
                  {formatCurrency(novoRevendaFaturamento)} + {formatCurrency(novoFoodServiceFaturamento)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(novoTotalFaturamento)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Detalhamento dos Cálculos - Custos Variáveis</span>
            <Badge variant="outline">{codePrefix}-COSTS</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Insumos Revenda */}
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-C001</span>
                <span className="font-medium">Insumos Revenda Padrão</span>
              </div>
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-medium">Proporção Base:</span> 
                  {formatCurrency(baseInsumosRevenda)} ÷ {formatCurrency(baseRevendaFaturamento)} = {formatPercent(proporcaoRevendaInsumos * 100)}
                </p>
                <p>
                  <span className="font-medium">Cálculo:</span> 
                  {formatCurrency(novoRevendaFaturamento)} × {formatPercent(proporcaoRevendaInsumos * 100)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(novosInsumosRevenda)}</p>
              </div>
            </div>

            {/* Insumos Food Service */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-C002</span>
                <span className="font-medium">Insumos Food Service</span>
              </div>
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-medium">Proporção Base:</span> 
                  {formatCurrency(baseInsumosFoodService)} ÷ {formatCurrency(baseFoodServiceFaturamento)} = {formatPercent(proporcaoFoodServiceInsumos * 100)}
                </p>
                <p>
                  <span className="font-medium">Cálculo:</span> 
                  {formatCurrency(novoFoodServiceFaturamento)} × {formatPercent(proporcaoFoodServiceInsumos * 100)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(novosInsumosFoodService)}</p>
              </div>
            </div>

            {/* Logística */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-C003</span>
                <span className="font-medium">Logística</span>
              </div>
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-medium">Proporção Base:</span> 
                  {formatCurrency(baseLogistica)} ÷ {formatCurrency(baseDRE.totalRevenue)} = {formatPercent(proporcaoLogistica * 100)}
                </p>
                <p>
                  <span className="font-medium">Cálculo:</span> 
                  {formatCurrency(novoTotalFaturamento)} × {formatPercent(proporcaoLogistica * 100)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(novaLogistica)}</p>
              </div>
            </div>

            {/* Aquisição de Clientes */}
            <div className="p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-C004</span>
                <span className="font-medium">Aquisição de Clientes</span>
              </div>
              <div className="text-sm space-y-2">
                <p>
                  <span className="font-medium">Proporção Base:</span> 
                  {formatCurrency(baseAquisicaoClientes)} ÷ {formatCurrency(baseDRE.totalRevenue)} = {formatPercent(proporcaoAquisicao * 100)}
                </p>
                <p>
                  <span className="font-medium">Cálculo:</span> 
                  {formatCurrency(novoTotalFaturamento)} × {formatPercent(proporcaoAquisicao * 100)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(novaAquisicaoClientes)}</p>
              </div>
            </div>

            {/* Total Custos Variáveis */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-muted-foreground">{codePrefix}-C005</span>
                <span className="font-medium">Total Custos Variáveis</span>
              </div>
              <div className="text-sm">
                <p className="mb-2">
                  <span className="font-medium">Cálculo:</span> 
                  {formatCurrency(novosInsumosRevenda)} + {formatCurrency(novosInsumosFoodService)} + {formatCurrency(novaLogistica)} + {formatCurrency(novaAquisicaoClientes)}
                </p>
                <p className="text-lg font-bold">{formatCurrency(novosInsumosRevenda + novosInsumosFoodService + novaLogistica + novaAquisicaoClientes)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
