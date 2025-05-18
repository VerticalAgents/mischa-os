
import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { DREData } from '@/types/projections';

interface DRETableProps {
  dreData: DREData;
  compact?: boolean;
}

export function DRETable({ dreData, compact = false }: DRETableProps) {
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
  
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(Math.round(value));
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[200px] font-bold">DRE Mensal - {dreData.name}</TableHead>
            <TableHead className="text-right font-bold">Valores</TableHead>
            {!compact && <TableHead className="text-right font-bold">%</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="bg-muted/20 font-medium">
            <TableCell>1. RECEITA OPERACIONAL</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.totalRevenue)}</TableCell>
            {!compact && <TableCell className="text-right">100%</TableCell>}
          </TableRow>

          {/* Channel breakdown */}
          {!compact && dreData.channelsData.map(channel => (
            <TableRow key={channel.channel}>
              <TableCell className="pl-8">{channel.channel}</TableCell>
              <TableCell className="text-right">{formatCurrency(channel.revenue)}</TableCell>
              <TableCell className="text-right">
                {formatPercent(channel.revenue / dreData.totalRevenue * 100)}
              </TableCell>
            </TableRow>
          ))}

          <TableRow className="bg-muted/20 font-medium">
            <TableCell>2. CUSTOS VARIÁVEIS</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.totalVariableCosts)}</TableCell>
            {!compact && <TableCell className="text-right">
              {formatPercent(dreData.totalVariableCosts / dreData.totalRevenue * 100)}
            </TableCell>}
          </TableRow>

          {!compact && dreData.channelsData.map(channel => (
            <TableRow key={`cost-${channel.channel}`}>
              <TableCell className="pl-8">{channel.channel}</TableCell>
              <TableCell className="text-right">{formatCurrency(channel.variableCosts)}</TableCell>
              <TableCell className="text-right">
                {formatPercent(channel.variableCosts / dreData.totalRevenue * 100)}
              </TableCell>
            </TableRow>
          ))}

          <TableRow className="bg-muted/50 font-medium">
            <TableCell>3. MARGEM DE CONTRIBUIÇÃO</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.grossProfit)}</TableCell>
            {!compact && <TableCell className="text-right">{formatPercent(dreData.grossMargin)}</TableCell>}
          </TableRow>

          <TableRow className="bg-muted/20 font-medium">
            <TableCell>4. CUSTOS FIXOS</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.totalFixedCosts)}</TableCell>
            {!compact && <TableCell className="text-right">
              {formatPercent(dreData.totalFixedCosts / dreData.totalRevenue * 100)}
            </TableCell>}
          </TableRow>

          {!compact && dreData.fixedCosts.map(cost => (
            <TableRow key={`fixed-${cost.name}`}>
              <TableCell className="pl-8">{cost.name}</TableCell>
              <TableCell className="text-right">{formatCurrency(cost.value)}</TableCell>
              <TableCell className="text-right">
                {formatPercent(cost.value / dreData.totalRevenue * 100)}
              </TableCell>
            </TableRow>
          ))}

          <TableRow className="bg-muted/20 font-medium">
            <TableCell>5. CUSTOS ADMINISTRATIVOS</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.totalAdministrativeCosts)}</TableCell>
            {!compact && <TableCell className="text-right">
              {formatPercent(dreData.totalAdministrativeCosts / dreData.totalRevenue * 100)}
            </TableCell>}
          </TableRow>

          {!compact && dreData.administrativeCosts.map(cost => (
            <TableRow key={`admin-${cost.name}`}>
              <TableCell className="pl-8">{cost.name}</TableCell>
              <TableCell className="text-right">{formatCurrency(cost.value)}</TableCell>
              <TableCell className="text-right">
                {formatPercent(cost.value / dreData.totalRevenue * 100)}
              </TableCell>
            </TableRow>
          ))}

          <TableRow className="bg-purple-100 font-medium">
            <TableCell>6. RESULTADO OPERACIONAL</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.operationalResult)}</TableCell>
            {!compact && <TableCell className="text-right">{formatPercent(dreData.operationalMargin)}</TableCell>}
          </TableRow>

          <TableRow className="bg-muted/20">
            <TableCell>7. DEPRECIAÇÃO MENSAL</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.monthlyDepreciation)}</TableCell>
            {!compact && <TableCell className="text-right">
              {formatPercent(dreData.monthlyDepreciation / dreData.totalRevenue * 100)}
            </TableCell>}
          </TableRow>

          <TableRow className="bg-purple-200 font-medium">
            <TableCell>8. EBITDA</TableCell>
            <TableCell className="text-right">{formatCurrency(dreData.ebitda)}</TableCell>
            {!compact && <TableCell className="text-right">{formatPercent(dreData.ebitdaMargin)}</TableCell>}
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={!compact ? 3 : 2}>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="font-medium">Investimento Total: {formatCurrency(dreData.totalInvestment)}</p>
                  <p className="text-sm text-muted-foreground">Payback estimado: {dreData.paybackMonths.toFixed(1)} meses</p>
                </div>
                <div>
                  <p className="font-medium">Ponto de Equilíbrio: {formatCurrency(dreData.breakEvenPoint)}</p>
                  <p className="text-sm text-muted-foreground">Unidades: {formatNumber(dreData.breakEvenPoint / (dreData.totalRevenue / dreData.channelsData.reduce((sum, c) => sum + c.volume, 0)))}</p>
                </div>
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
