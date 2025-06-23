import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer, ChevronDown, ChevronRight, Calculator } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DREData } from '@/types/projections';
import { DRECalculationDetails } from './DRECalculationDetails';

interface DRETableHierarchicalProps {
  dreData: DREData;
}

interface DREItem {
  id: string;
  categoria: string;
  valor: number;
  percentual: number;
  level: number;
  isExpandable?: boolean;
  isExpanded?: boolean;
  isTotal?: boolean;
  isSubtotal?: boolean;
  isHighlight?: boolean;
  parentId?: string;
  children?: DREItem[];
}

export function DRETableHierarchical({ dreData }: DRETableHierarchicalProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

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

  // Use EXACTLY the values from dreData - no additional calculations
  const receita = dreData.totalRevenue; // This should be R$ 36.246,00
  const breakdown = dreData.detailedBreakdown;
  
  // Use the exact values from the breakdown
  const receitaRevenda = breakdown?.revendaPadraoFaturamento || 0;
  const receitaFoodService = breakdown?.foodServiceFaturamento || 0;
  
  const custosVariaveis = dreData.totalVariableCosts; // This should be R$ 12.807,48
  const logistica = breakdown?.totalLogistica || 0; // R$ 1.449,84
  const insumosRevenda = breakdown?.totalInsumosRevenda || 0; // R$ 8.907,36
  const insumosFoodService = breakdown?.totalInsumosFoodService || 0; // R$ 2.450,28
  const aquisicaoClientes = breakdown?.aquisicaoClientes || 0; // R$ 2.899,68
  
  const lucroBruto = receita - custosVariaveis;
  const custosFixos = dreData.totalFixedCosts;
  const custoAdm = dreData.totalAdministrativeCosts;
  const lucroOperacional = dreData.operationalResult;
  const resultadoLiquido = lucroOperacional;

  console.log('DRE Debug Values:', {
    receita,
    receitaRevenda,
    receitaFoodService,
    custosVariaveis,
    logistica,
    insumosRevenda,
    insumosFoodService,
    aquisicaoClientes,
    breakdown
  });

  const dreItems: DREItem[] = [
    {
      id: '1',
      categoria: '1. RECEITA OPERACIONAL',
      valor: receita,
      percentual: 100,
      level: 0,
      isTotal: true,
      isExpandable: true,
      children: [{
        id: '1.1',
        categoria: '1.1. REVENDA',
        valor: receitaRevenda + receitaFoodService,
        percentual: (receitaRevenda + receitaFoodService) / receita * 100,
        level: 1,
        isExpandable: true,
        children: [{
          id: '1.1.1',
          categoria: '1.1.1. Revenda Padrão',
          valor: receitaRevenda,
          percentual: receitaRevenda / receita * 100,
          level: 2
        }, {
          id: '1.1.2',
          categoria: '1.1.2. Food Service',
          valor: receitaFoodService,
          percentual: receitaFoodService / receita * 100,
          level: 2
        }]
      }]
    },
    {
      id: '2',
      categoria: '2. CUSTOS VARIÁVEIS',
      valor: custosVariaveis,
      percentual: custosVariaveis / receita * 100,
      level: 0,
      isExpandable: true,
      children: [
        {
          id: '2.1',
          categoria: '2.1. LOGÍSTICA',
          valor: logistica,
          percentual: logistica / receita * 100,
          level: 1
        },
        {
          id: '2.2',
          categoria: '2.2. INSUMOS',
          valor: insumosRevenda + insumosFoodService,
          percentual: (insumosRevenda + insumosFoodService) / receita * 100,
          level: 1,
          isExpandable: true,
          children: [{
            id: '2.2.1',
            categoria: '2.2.1. Revenda Padrão',
            valor: insumosRevenda,
            percentual: insumosRevenda / receita * 100,
            level: 2
          }, {
            id: '2.2.2',
            categoria: '2.2.2. Food Service',
            valor: insumosFoodService,
            percentual: insumosFoodService / receita * 100,
            level: 2
          }]
        },
        {
          id: '2.3',
          categoria: '2.3. AQUISIÇÃO DE CLIENTES',
          valor: aquisicaoClientes,
          percentual: aquisicaoClientes / receita * 100,
          level: 1
        }
      ]
    },
    {
      id: '3',
      categoria: '3. LUCRO BRUTO MENSAL',
      valor: lucroBruto,
      percentual: lucroBruto / receita * 100,
      level: 0,
      isSubtotal: true
    },
    {
      id: '4',
      categoria: '4. CUSTOS FIXOS',
      valor: custosFixos,
      percentual: custosFixos / receita * 100,
      level: 0,
      isExpandable: false
    },
    {
      id: '5',
      categoria: '5. CUSTOS ADMINISTRATIVOS',
      valor: custoAdm,
      percentual: custoAdm / receita * 100,
      level: 0,
      isExpandable: false
    },
    {
      id: '6',
      categoria: '6. LUCRO OPERACIONAL',
      valor: lucroOperacional,
      percentual: lucroOperacional / receita * 100,
      level: 0,
      isSubtotal: true
    },
    {
      id: '7',
      categoria: '7. RESULTADO LÍQUIDO',
      valor: resultadoLiquido,
      percentual: resultadoLiquido / receita * 100,
      level: 0,
      isHighlight: true
    }
  ];

  const isDataLoaded = dreData && dreData.detailedBreakdown && dreData.totalRevenue > 0;

  const toggleExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const renderDREItems = (items: DREItem[]): React.ReactNode[] => {
    const result: React.ReactNode[] = [];

    items.forEach(item => {
      const rowClass = item.isTotal
        ? 'bg-blue-50 font-semibold border-t-2 border-blue-200'
        : item.isSubtotal
        ? 'bg-green-50 font-semibold border-t border-green-200'
        : item.isHighlight
        ? 'bg-purple-50 font-semibold border-t border-purple-200'
        : item.level === 1
        ? 'bg-slate-25'
        : item.level === 2
        ? 'bg-slate-15'
        : item.level === 3
        ? 'bg-slate-10'
        : '';

      const isExpanded = expandedItems.has(item.id);
      const paddingLeft = item.level * 16;

      result.push(
        <TableRow key={item.id} className={rowClass}>
          <TableCell 
            className="font-medium min-w-0" 
            style={{ paddingLeft: `${paddingLeft + 16}px` }}
          >
            <div className="flex items-center min-w-0">
              {item.isExpandable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 mr-2 flex-shrink-0"
                  onClick={() => toggleExpansion(item.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {!item.isExpandable && <div className="w-10 flex-shrink-0" />}
              <span className="break-words hyphens-auto text-sm leading-tight" style={{ wordBreak: 'break-word' }}>
                {item.categoria}
              </span>
            </div>
          </TableCell>
          <TableCell className="text-right font-mono whitespace-nowrap min-w-[120px]">
            {formatCurrency(item.valor)}
          </TableCell>
          <TableCell className="text-right font-mono whitespace-nowrap min-w-[80px]">
            {formatPercent(item.percentual)}
          </TableCell>
        </TableRow>
      );

      if (isExpanded && item.children) {
        result.push(...renderDREItems(item.children));
      }
    });

    return result;
  };

  const exportData = () => {
    const flattenItems = (items: DREItem[]): DREItem[] => {
      const result: DREItem[] = [];
      items.forEach(item => {
        result.push(item);
        if (item.children) {
          result.push(...flattenItems(item.children));
        }
      });
      return result;
    };

    const allItems = flattenItems(dreItems);
    const csvContent = [
      'Categoria,Valor,Percentual',
      ...allItems.map(item => 
        `"${item.categoria}","${formatCurrency(item.valor)}","${formatPercent(item.percentual)}"`
      )
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
    <div className="space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold truncate">DRE - {dreData.name}</h3>
        <div className="flex gap-2 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowCalculationDetails(true)}
                  disabled={!isDataLoaded}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  Ver passo a passo
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isDataLoaded 
                  ? "Visualizar cálculos detalhados da DRE" 
                  : "Disponível apenas após o carregamento completo da DRE"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
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

      <div className="w-full overflow-x-auto border rounded-md">
        <div className="min-w-[600px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead className="font-bold min-w-[300px]">Categoria</TableHead>
                <TableHead className="text-right font-bold min-w-[120px]">Valor</TableHead>
                <TableHead className="text-right font-bold min-w-[80px]">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {renderDREItems(dreItems)}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-4 print:hidden space-y-1">
        <p>📊 Os percentuais são calculados com base na Receita Operacional total</p>
        <p>💡 Clique nos ícones de seta para expandir/recolher categorias</p>
        <p>🔍 Dados sincronizados com "Projeção de Resultados por PDV"</p>
        <p>✅ Receita: R$ {formatCurrency(receita).replace('R$ ', '')} | Insumos: R$ {formatCurrency(insumosRevenda + insumosFoodService).replace('R$ ', '')} | Aquisição: R$ {formatCurrency(aquisicaoClientes).replace('R$ ', '')}</p>
      </div>

      <DRECalculationDetails 
        open={showCalculationDetails}
        onOpenChange={setShowCalculationDetails}
        dreData={dreData}
      />
    </div>
  );
}
