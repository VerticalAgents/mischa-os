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
    return <Card className="h-full">
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
            <Progress value={Math.max(0, dreData.operationalMargin)} className="h-2" />
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
      </Card>;
  }
  return;
}