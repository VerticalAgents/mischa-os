
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

export function ModernDRETable({
  dreData,
  compact = false
}: ModernDRETableProps) {
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
    }).format(value / 100);
  };

  const getMarginColor = (margin: number) => {
    if (margin >= 20) return "text-green-600";
    if (margin >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (value: number, total: number) => {
    const percentage = value / total * 100;
    if (percentage <= 30) return "bg-green-500";
    if (percentage <= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (compact) {
    return (
      <Card className="h-full min-w-[300px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">{dreData.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <p className="text-sm text-muted-foreground whitespace-nowrap">Receita Total</p>
              <p className="text-xl font-bold text-green-600 break-words">{formatCurrency(dreData.totalRevenue)}</p>
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-sm text-muted-foreground whitespace-nowrap">Resultado Op.</p>
              <p className={`text-xl font-bold break-words ${getMarginColor(dreData.operationalMargin)}`}>
                {formatCurrency(dreData.operationalResult)}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm items-center">
              <span className="whitespace-nowrap">Margem Operacional</span>
              <span className={`${getMarginColor(dreData.operationalMargin)} font-medium`}>
                {formatPercent(dreData.operationalMargin)}
              </span>
            </div>
            <Progress value={Math.max(0, dreData.operationalMargin)} className="h-2" />
          </div>

          <div className="pt-2 border-t space-y-2">
            <div className="flex justify-between text-sm items-center">
              <span className="whitespace-nowrap">EBITDA</span>
              <span className="font-medium break-words">{formatCurrency(dreData.ebitda)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="whitespace-nowrap">Ponto de Equilíbrio</span>
              <span className="font-medium break-words">{formatCurrency(dreData.breakEvenPoint)}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="whitespace-nowrap">Payback</span>
              <span className="font-medium whitespace-nowrap">{dreData.paybackMonths.toFixed(1)} meses</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Modo completo com melhor estrutura responsiva
  return (
    <Card className="h-full min-w-[400px] w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary flex-shrink-0" />
          <span className="truncate">{dreData.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção de Receitas */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Receitas
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 min-w-0">
              <p className="text-sm text-muted-foreground">Receita Total</p>
              <p className="text-2xl font-bold text-green-600 break-words">{formatCurrency(dreData.totalRevenue)}</p>
            </div>
            <div className="space-y-2 min-w-0">
              <p className="text-sm text-muted-foreground">Margem Bruta</p>
              <p className="text-xl font-bold break-words">{formatPercent(dreData.grossMargin)}</p>
            </div>
          </div>
        </div>

        {/* Seção de Custos */}
        <div className="space-y-3">
          <h4 className="font-semibold text-lg">Custos</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custos Variáveis</span>
              <span className="font-medium break-words">{formatCurrency(dreData.totalVariableCosts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custos Fixos</span>
              <span className="font-medium break-words">{formatCurrency(dreData.totalFixedCosts)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Custos Administrativos</span>
              <span className="font-medium break-words">{formatCurrency(dreData.totalAdministrativeCosts)}</span>
            </div>
          </div>
        </div>

        {/* Resultado Operacional */}
        <div className="space-y-3 pt-2 border-t">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Resultado Operacional</span>
              <span className={`text-xl font-bold break-words ${getMarginColor(dreData.operationalMargin)}`}>
                {formatCurrency(dreData.operationalResult)}
              </span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span>Margem Operacional</span>
              <span className={`${getMarginColor(dreData.operationalMargin)} font-medium`}>
                {formatPercent(dreData.operationalMargin)}
              </span>
            </div>
            <Progress value={Math.max(0, dreData.operationalMargin)} className="h-3" />
          </div>
        </div>

        {/* Métricas Adicionais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-muted-foreground">EBITDA</p>
            <p className="text-lg font-bold break-words">{formatCurrency(dreData.ebitda)}</p>
            <p className="text-xs text-muted-foreground">
              Margem: {formatPercent(dreData.ebitdaMargin)}
            </p>
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-sm text-muted-foreground">Ponto de Equilíbrio</p>
            <p className="text-lg font-bold break-words">{formatCurrency(dreData.breakEvenPoint)}</p>
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Payback: {dreData.paybackMonths.toFixed(1)} meses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
