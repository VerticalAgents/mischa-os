
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DREData } from '@/types/projections';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart } from 'lucide-react';

interface ModernDRETableProps {
  dreData: DREData;
  compact?: boolean;
}

export function ModernDRETable({ dreData, compact = false }: ModernDRETableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value/100);
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return "text-green-600";
    if (margin >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (value: number, total: number) => {
    const percentage = (value / total) * 100;
    if (percentage <= 30) return "bg-green-500";
    if (percentage <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            {dreData.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(dreData.totalRevenue)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Resultado Op.</p>
              <p className={`text-xl font-bold ${getMarginColor(dreData.operationalMargin)}`}>
                {formatCurrency(dreData.operationalResult)}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Margem Operacional</span>
              <span className={getMarginColor(dreData.operationalMargin)}>
                {formatPercent(dreData.operationalMargin)}
              </span>
            </div>
            <Progress 
              value={Math.max(0, dreData.operationalMargin)} 
              className="h-2"
            />
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span>EBITDA</span>
              <span className="font-medium">{formatCurrency(dreData.ebitda)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ponto de Equilíbrio</span>
              <span className="font-medium">{formatCurrency(dreData.breakEvenPoint)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Payback</span>
              <span className="font-medium">{dreData.paybackMonths.toFixed(1)} meses</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Receita Total</p>
                <p className="text-2xl font-bold text-green-800">{formatCurrency(dreData.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Margem Bruta</p>
                <p className="text-2xl font-bold text-blue-800">{formatPercent(dreData.grossMargin)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${dreData.operationalResult >= 0 ? 'from-purple-50 to-purple-100 border-purple-200' : 'from-red-50 to-red-100 border-red-200'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${dreData.operationalResult >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                  Resultado Op.
                </p>
                <p className={`text-2xl font-bold ${dreData.operationalResult >= 0 ? 'text-purple-800' : 'text-red-800'}`}>
                  {formatCurrency(dreData.operationalResult)}
                </p>
              </div>
              {dreData.operationalResult >= 0 ? 
                <TrendingUp className="h-8 w-8 text-purple-600" /> : 
                <TrendingDown className="h-8 w-8 text-red-600" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">EBITDA</p>
                <p className="text-2xl font-bold text-orange-800">{formatCurrency(dreData.ebitda)}</p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Receita por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dreData.channelsData.map((channel) => (
              <div key={channel.channel} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{channel.channel}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(channel.volume)} unidades
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(channel.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPercent(channel.revenue / dreData.totalRevenue * 100)}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={(channel.revenue / dreData.totalRevenue) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Costs Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custos Fixos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(dreData.totalFixedCosts)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dreData.fixedCosts.map((cost, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{cost.name}</span>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(cost.value)}</span>
                    <div className="w-20 h-1 bg-gray-200 rounded mt-1">
                      <div 
                        className={`h-full rounded ${getProgressColor(cost.value, dreData.totalFixedCosts)}`}
                        style={{ width: `${(cost.value / dreData.totalFixedCosts) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custos Administrativos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total: {formatCurrency(dreData.totalAdministrativeCosts)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dreData.administrativeCosts.map((cost, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{cost.name}</span>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(cost.value)}</span>
                    <div className="w-20 h-1 bg-gray-200 rounded mt-1">
                      <div 
                        className={`h-full rounded ${getProgressColor(cost.value, dreData.totalAdministrativeCosts)}`}
                        style={{ width: `${(cost.value / dreData.totalAdministrativeCosts) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Investimento Total</p>
              <p className="text-xl font-bold">{formatCurrency(dreData.totalInvestment)}</p>
              <p className="text-sm text-muted-foreground">
                Depreciação mensal: {formatCurrency(dreData.monthlyDepreciation)}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Ponto de Equilíbrio</p>
              <p className="text-xl font-bold">{formatCurrency(dreData.breakEvenPoint)}</p>
              <p className="text-sm text-muted-foreground">
                Unidades necessárias mensalmente
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Retorno do Investimento</p>
              <p className="text-xl font-bold">{dreData.paybackMonths.toFixed(1)} meses</p>
              <p className="text-sm text-muted-foreground">
                Payback estimado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
