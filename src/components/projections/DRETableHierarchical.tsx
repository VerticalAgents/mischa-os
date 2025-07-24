
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DREData } from '@/types/projections';

interface DRETableHierarchicalProps {
  dreData: DREData;
  compact?: boolean;
}

export function DRETableHierarchical({ dreData, compact = false }: DRETableHierarchicalProps) {
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

  const getCodePrefix = () => {
    if (dreData.isBase) return 'DRE-BASE';
    return `DRE-${dreData.id.slice(0, 8).toUpperCase()}`;
  };

  const codePrefix = getCodePrefix();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>{dreData.name}</span>
          {dreData.isBase && <Badge variant="secondary">Base</Badge>}
          <Badge variant="outline">{codePrefix}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[60px] font-bold">Código</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="text-right font-bold">Valores</TableHead>
                {!compact && <TableHead className="text-right font-bold">%</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 1. RECEITA OPERACIONAL */}
              <TableRow className="bg-green-50 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-001</TableCell>
                <TableCell>1. RECEITA OPERACIONAL</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.totalRevenue)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">100,0%</TableCell>}
              </TableRow>

              {/* Channel breakdown */}
              {!compact && dreData.channelsData.map((channel, index) => (
                <TableRow key={channel.channel}>
                  <TableCell className="text-xs text-muted-foreground">{codePrefix}-00{index + 2}</TableCell>
                  <TableCell className="pl-8 text-sm">{channel.channel}</TableCell>
                  <TableCell className="text-right">{formatCurrency(channel.revenue)}</TableCell>
                  <TableCell className="text-right">
                    {formatPercent(channel.revenue / dreData.totalRevenue * 100)}
                  </TableCell>
                </TableRow>
              ))}

              {/* 2. CUSTOS VARIÁVEIS */}
              <TableRow className="bg-red-50 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-010</TableCell>
                <TableCell>2. CUSTOS VARIÁVEIS</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.totalVariableCosts)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">
                  {formatPercent(dreData.totalVariableCosts / dreData.totalRevenue * 100)}
                </TableCell>}
              </TableRow>

              {/* Variable costs breakdown */}
              {!compact && dreData.detailedBreakdown && (
                <>
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground">{codePrefix}-011</TableCell>
                    <TableCell className="pl-8 text-sm">Insumos Revenda Padrão</TableCell>
                    <TableCell className="text-right">{formatCurrency(dreData.detailedBreakdown.totalInsumosRevenda)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(dreData.detailedBreakdown.totalInsumosRevenda / dreData.totalRevenue * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground">{codePrefix}-012</TableCell>
                    <TableCell className="pl-8 text-sm">Insumos Food Service</TableCell>
                    <TableCell className="text-right">{formatCurrency(dreData.detailedBreakdown.totalInsumosFoodService)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(dreData.detailedBreakdown.totalInsumosFoodService / dreData.totalRevenue * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground">{codePrefix}-013</TableCell>
                    <TableCell className="pl-8 text-sm">Logística</TableCell>
                    <TableCell className="text-right">{formatCurrency(dreData.detailedBreakdown.totalLogistica)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(dreData.detailedBreakdown.totalLogistica / dreData.totalRevenue * 100)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs text-muted-foreground">{codePrefix}-014</TableCell>
                    <TableCell className="pl-8 text-sm">Aquisição de Clientes</TableCell>
                    <TableCell className="text-right">{formatCurrency(dreData.detailedBreakdown.aquisicaoClientes)}</TableCell>
                    <TableCell className="text-right">
                      {formatPercent(dreData.detailedBreakdown.aquisicaoClientes / dreData.totalRevenue * 100)}
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* 3. MARGEM DE CONTRIBUIÇÃO */}
              <TableRow className="bg-blue-50 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-020</TableCell>
                <TableCell>3. MARGEM DE CONTRIBUIÇÃO</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.grossProfit)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">{formatPercent(dreData.grossMargin)}</TableCell>}
              </TableRow>

              {/* 4. CUSTOS FIXOS */}
              <TableRow className="bg-orange-50 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-030</TableCell>
                <TableCell>4. CUSTOS FIXOS</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.totalFixedCosts)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">
                  {formatPercent(dreData.totalFixedCosts / dreData.totalRevenue * 100)}
                </TableCell>}
              </TableRow>

              {/* Fixed costs breakdown */}
              {!compact && dreData.fixedCosts.map((cost, index) => (
                <TableRow key={`fixed-${cost.name}`}>
                  <TableCell className="text-xs text-muted-foreground">{codePrefix}-0{31 + index}</TableCell>
                  <TableCell className="pl-8 text-sm">{cost.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cost.value)}</TableCell>
                  <TableCell className="text-right">
                    {formatPercent(cost.value / dreData.totalRevenue * 100)}
                  </TableCell>
                </TableRow>
              ))}

              {/* 5. CUSTOS ADMINISTRATIVOS */}
              <TableRow className="bg-purple-50 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-040</TableCell>
                <TableCell>5. CUSTOS ADMINISTRATIVOS</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.totalAdministrativeCosts)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">
                  {formatPercent(dreData.totalAdministrativeCosts / dreData.totalRevenue * 100)}
                </TableCell>}
              </TableRow>

              {/* Administrative costs breakdown */}
              {!compact && dreData.administrativeCosts.map((cost, index) => (
                <TableRow key={`admin-${cost.name}`}>
                  <TableCell className="text-xs text-muted-foreground">{codePrefix}-0{41 + index}</TableCell>
                  <TableCell className="pl-8 text-sm">{cost.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(cost.value)}</TableCell>
                  <TableCell className="text-right">
                    {formatPercent(cost.value / dreData.totalRevenue * 100)}
                  </TableCell>
                </TableRow>
              ))}

              {/* 6. RESULTADO OPERACIONAL */}
              <TableRow className="bg-green-100 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-050</TableCell>
                <TableCell>6. RESULTADO OPERACIONAL</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.operationalResult)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">{formatPercent(dreData.operationalMargin)}</TableCell>}
              </TableRow>

              {/* 7. DEPRECIAÇÃO MENSAL */}
              <TableRow>
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-060</TableCell>
                <TableCell>7. DEPRECIAÇÃO MENSAL</TableCell>
                <TableCell className="text-right">{formatCurrency(dreData.monthlyDepreciation)}</TableCell>
                {!compact && <TableCell className="text-right">
                  {formatPercent(dreData.monthlyDepreciation / dreData.totalRevenue * 100)}
                </TableCell>}
              </TableRow>

              {/* 8. EBITDA */}
              <TableRow className="bg-yellow-100 font-medium">
                <TableCell className="text-xs text-muted-foreground">{codePrefix}-070</TableCell>
                <TableCell>8. EBITDA</TableCell>
                <TableCell className="text-right font-bold">{formatCurrency(dreData.ebitda)}</TableCell>
                {!compact && <TableCell className="text-right font-bold">{formatPercent(dreData.ebitdaMargin)}</TableCell>}
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={!compact ? 4 : 3}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{codePrefix}-080</span>
                        <span className="font-medium">Investimento Total:</span>
                        <span className="font-bold">{formatCurrency(dreData.totalInvestment)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{codePrefix}-081</span>
                        <span className="text-sm text-muted-foreground">Payback estimado:</span>
                        <span className="text-sm font-medium">{dreData.paybackMonths.toFixed(1)} meses</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{codePrefix}-082</span>
                        <span className="font-medium">Ponto de Equilíbrio:</span>
                        <span className="font-bold">{formatCurrency(dreData.breakEvenPoint)}</span>
                      </div>
                      {dreData.pdvsAtivos && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">{codePrefix}-083</span>
                          <span className="text-sm text-muted-foreground">PDVs Ativos:</span>
                          <span className="text-sm font-medium">{dreData.pdvsAtivos}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
