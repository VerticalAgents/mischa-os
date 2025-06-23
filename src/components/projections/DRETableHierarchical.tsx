
import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { DREData } from '@/types/projections';

interface DRETableHierarchicalProps {
  dreData: DREData;
}

export function DRETableHierarchical({ dreData }: DRETableHierarchicalProps) {
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
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value) + '%';
  };

  // Calcular valores para a estrutura do DRE
  const receita = dreData.totalRevenue;
  const custoVariavel = dreData.totalVariableCosts;
  const custoFixo = dreData.totalFixedCosts;
  const custoAdm = dreData.totalAdministrativeCosts;
  const lucroBruto = dreData.grossProfit;
  const lucroOperacional = dreData.operationalResult;
  const resultadoLiquido = dreData.operationalResult - (dreData.totalRevenue * 0.04); // Estimativa de impostos

  // Estrutura do DRE conforme os prints enviados
  const dreItems = [
    {
      id: 1,
      categoria: '1. RECEITA OPERACIONAL',
      valor: receita,
      percentual: 100,
      isTotal: true
    },
    {
      id: 2,
      categoria: '2. CUSTOS VARIÁVEIS',
      valor: custoVariavel,
      percentual: (custoVariavel / receita) * 100,
      isTotal: false
    },
    {
      id: 3,
      categoria: '3. MARGEM DE CONTRIBUIÇÃO',
      valor: lucroBruto,
      percentual: (lucroBruto / receita) * 100,
      isSubtotal: true
    },
    {
      id: 4,
      categoria: '4. CUSTOS FIXOS',
      valor: custoFixo,
      percentual: (custoFixo / receita) * 100,
      isTotal: false
    },
    {
      id: 5,
      categoria: '5. CUSTOS ADMINISTRATIVOS',
      valor: custoAdm,
      percentual: (custoAdm / receita) * 100,
      isTotal: false
    },
    {
      id: 6,
      categoria: '6. RESULTADO OPERACIONAL',
      valor: lucroOperacional,
      percentual: (lucroOperacional / receita) * 100,
      isSubtotal: true
    },
    {
      id: 7,
      categoria: '7. DEPRECIAÇÃO MENSAL',
      valor: dreData.monthlyDepreciation,
      percentual: (dreData.monthlyDepreciation / receita) * 100,
      isTotal: false
    },
    {
      id: 8,
      categoria: '8. EBITDA',
      valor: dreData.ebitda,
      percentual: (dreData.ebitda / receita) * 100,
      isHighlight: true
    }
  ];

  const exportData = () => {
    const csvContent = [
      'Categoria,Valor,Percentual',
      ...dreItems.map(item => `"${item.categoria}","${formatCurrency(item.valor)}","${formatPercent(item.percentual)}"`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DRE-${dreData.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printDRE = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">DRE - {dreData.name}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={printDRE}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="w-[60%] font-bold">Categoria</TableHead>
              <TableHead className="text-right font-bold">Valor</TableHead>
              <TableHead className="text-right font-bold">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dreItems.map((item) => {
              const rowClass = item.isTotal ? 'bg-blue-50 font-semibold border-t-2 border-blue-200' 
                             : item.isSubtotal ? 'bg-green-50 font-semibold border-t border-green-200'
                             : item.isHighlight ? 'bg-purple-50 font-semibold border-t border-purple-200'
                             : '';

              return (
                <TableRow key={item.id} className={rowClass}>
                  <TableCell className="font-medium">{item.categoria}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(item.valor)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPercent(item.percentual)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
        <div className="bg-slate-50 p-3 rounded">
          <div className="font-semibold text-slate-700">Investimento Total:</div>
          <div className="text-lg font-bold">{formatCurrency(dreData.totalInvestment)}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded">
          <div className="font-semibold text-slate-700">Ponto de Equilíbrio:</div>
          <div className="text-lg font-bold">{formatCurrency(dreData.breakEvenPoint)}</div>
        </div>
        <div className="bg-slate-50 p-3 rounded">
          <div className="font-semibold text-slate-700">Payback estimado:</div>
          <div className="text-lg font-bold">{dreData.paybackMonths.toFixed(1)} meses</div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-4 print:hidden">
        <p>📊 Os percentuais são calculados com base na Receita Operacional total</p>
        <p>💡 EBITDA = Resultado Operacional + Depreciação</p>
      </div>
    </div>
  );
}
