
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
import { ChevronDown, ChevronRight, Download, Printer } from "lucide-react";
import { DREData } from '@/types/projections';

interface DRETableHierarchicalProps {
  dreData: DREData;
}

interface DREItem {
  id: string;
  level: number;
  name: string;
  value: number;
  percentage: number;
  isExpandable: boolean;
  isExpanded: boolean;
  children?: DREItem[];
  isTotal?: boolean;
  isSubtotal?: boolean;
}

export function DRETableHierarchical({ dreData }: DRETableHierarchicalProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set([
    '1', '2', '4', '4.1', '4.1.1', '4.1.2', '4.1.3', '4.1.3.9', '4.1.3.10', '4.2', '4.3'
  ]));

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

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // Calcular valores para a estrutura hierárquica
  const receita = dreData.totalRevenue;
  const custoVariavel = dreData.totalVariableCosts;
  const custoFixo = dreData.totalFixedCosts;
  const custoAdm = dreData.totalAdministrativeCosts;
  const lucroBruto = dreData.grossProfit;
  const lucroOperacional = dreData.operationalResult;
  const resultadoLiquido = dreData.operationalResult - (dreData.totalRevenue * 0.04); // Estimativa de impostos

  // Estrutura hierárquica do DRE
  const dreStructure: DREItem[] = [
    {
      id: '1',
      level: 0,
      name: '1. RECEITA OPERACIONAL',
      value: receita,
      percentage: 100,
      isExpandable: true,
      isExpanded: expandedItems.has('1'),
      isTotal: true,
      children: [
        {
          id: '1.1',
          level: 1,
          name: '1.1. REVENDA',
          value: receita,
          percentage: 100,
          isExpandable: true,
          isExpanded: expandedItems.has('1.1'),
          children: [
            {
              id: '1.1.1',
              level: 2,
              name: '1.1.1. Revenda Padrão',
              value: receita * 0.7,
              percentage: 70,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '1.1.2',
              level: 2,
              name: '1.1.2. Food Service',
              value: receita * 0.3,
              percentage: 30,
              isExpandable: false,
              isExpanded: false
            }
          ]
        }
      ]
    },
    {
      id: '2',
      level: 0,
      name: '2. CUSTOS VARIÁVEIS',
      value: custoVariavel,
      percentage: (custoVariavel / receita) * 100,
      isExpandable: true,
      isExpanded: expandedItems.has('2'),
      isTotal: true,
      children: [
        {
          id: '2.1',
          level: 1,
          name: '2.1. LOGÍSTICA',
          value: custoVariavel * 0.4,
          percentage: (custoVariavel * 0.4 / receita) * 100,
          isExpandable: false,
          isExpanded: false
        },
        {
          id: '2.2',
          level: 1,
          name: '2.2. INSUMOS',
          value: custoVariavel * 0.55,
          percentage: (custoVariavel * 0.55 / receita) * 100,
          isExpandable: true,
          isExpanded: expandedItems.has('2.2'),
          children: [
            {
              id: '2.2.1',
              level: 2,
              name: '2.2.1. Revenda Padrão',
              value: custoVariavel * 0.35,
              percentage: (custoVariavel * 0.35 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '2.2.2',
              level: 2,
              name: '2.2.2. Food Service',
              value: custoVariavel * 0.2,
              percentage: (custoVariavel * 0.2 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            }
          ]
        },
        {
          id: '2.3',
          level: 1,
          name: '2.3. AQUISIÇÃO DE CLIENTES',
          value: custoVariavel * 0.05,
          percentage: (custoVariavel * 0.05 / receita) * 100,
          isExpandable: false,
          isExpanded: false
        }
      ]
    },
    {
      id: '3',
      level: 0,
      name: '3. LUCRO BRUTO MENSAL',
      value: lucroBruto,
      percentage: (lucroBruto / receita) * 100,
      isExpandable: false,
      isExpanded: false,
      isSubtotal: true
    },
    {
      id: '4',
      level: 0,
      name: '4. CUSTOS FIXOS',
      value: custoFixo + custoAdm,
      percentage: ((custoFixo + custoAdm) / receita) * 100,
      isExpandable: true,
      isExpanded: expandedItems.has('4'),
      isTotal: true,
      children: [
        {
          id: '4.1',
          level: 1,
          name: '4.1. DESPESAS OPERACIONAIS',
          value: custoFixo * 0.8,
          percentage: (custoFixo * 0.8 / receita) * 100,
          isExpandable: true,
          isExpanded: expandedItems.has('4.1'),
          children: [
            {
              id: '4.1.1',
              level: 2,
              name: '4.1.1. PRÓ-LABORE',
              value: custoFixo * 0.25,
              percentage: (custoFixo * 0.25 / receita) * 100,
              isExpandable: true,
              isExpanded: expandedItems.has('4.1.1'),
              children: [
                {
                  id: '4.1.1.1',
                  level: 3,
                  name: '4.1.1.1. Lucca',
                  value: custoFixo * 0.25,
                  percentage: (custoFixo * 0.25 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                }
              ]
            },
            {
              id: '4.1.2',
              level: 2,
              name: '4.1.2. DESPESAS COM PESSOAL',
              value: custoFixo * 0.3,
              percentage: (custoFixo * 0.3 / receita) * 100,
              isExpandable: true,
              isExpanded: expandedItems.has('4.1.2'),
              children: [
                {
                  id: '4.1.2.1',
                  level: 3,
                  name: '4.1.2.1. Folha de Pagamento',
                  value: custoFixo * 0.15,
                  percentage: (custoFixo * 0.15 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.2.2',
                  level: 3,
                  name: '4.1.2.2. VT',
                  value: custoFixo * 0.05,
                  percentage: (custoFixo * 0.05 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.2.3',
                  level: 3,
                  name: '4.1.2.3. VA',
                  value: custoFixo * 0.03,
                  percentage: (custoFixo * 0.03 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.2.4',
                  level: 3,
                  name: '4.1.2.4. Comissões',
                  value: custoFixo * 0.04,
                  percentage: (custoFixo * 0.04 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.2.5',
                  level: 3,
                  name: '4.1.2.5. Terceirizados',
                  value: custoFixo * 0.03,
                  percentage: (custoFixo * 0.03 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                }
              ]
            },
            {
              id: '4.1.3',
              level: 2,
              name: '4.1.3. INFRAESTRUTURA',
              value: custoFixo * 0.25,
              percentage: (custoFixo * 0.25 / receita) * 100,
              isExpandable: true,
              isExpanded: expandedItems.has('4.1.3'),
              children: [
                {
                  id: '4.1.3.1',
                  level: 3,
                  name: '4.1.3.1. Material de Limpeza',
                  value: custoFixo * 0.02,
                  percentage: (custoFixo * 0.02 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.2',
                  level: 3,
                  name: '4.1.3.2. Material de Escritório',
                  value: custoFixo * 0.015,
                  percentage: (custoFixo * 0.015 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.3',
                  level: 3,
                  name: '4.1.3.3. Energia Elétrica',
                  value: custoFixo * 0.06,
                  percentage: (custoFixo * 0.06 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.4',
                  level: 3,
                  name: '4.1.3.4. Aluguel',
                  value: custoFixo * 0.08,
                  percentage: (custoFixo * 0.08 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.5',
                  level: 3,
                  name: '4.1.3.5. Água',
                  value: custoFixo * 0.01,
                  percentage: (custoFixo * 0.01 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.6',
                  level: 3,
                  name: '4.1.3.6. Sistemas',
                  value: custoFixo * 0.02,
                  percentage: (custoFixo * 0.02 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.7',
                  level: 3,
                  name: '4.1.3.7. Telefone',
                  value: custoFixo * 0.015,
                  percentage: (custoFixo * 0.015 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.8',
                  level: 3,
                  name: '4.1.3.8. Internet',
                  value: custoFixo * 0.02,
                  percentage: (custoFixo * 0.02 / receita) * 100,
                  isExpandable: false,
                  isExpanded: false
                },
                {
                  id: '4.1.3.9',
                  level: 3,
                  name: '4.1.3.9. Licenças e Sistemas',
                  value: custoFixo * 0.035,
                  percentage: (custoFixo * 0.035 / receita) * 100,
                  isExpandable: true,
                  isExpanded: expandedItems.has('4.1.3.9'),
                  children: [
                    {
                      id: '4.1.3.9.1',
                      level: 4,
                      name: '4.1.3.9.1. ERP Gestão Click',
                      value: custoFixo * 0.015,
                      percentage: (custoFixo * 0.015 / receita) * 100,
                      isExpandable: false,
                      isExpanded: false
                    },
                    {
                      id: '4.1.3.9.2',
                      level: 4,
                      name: '4.1.3.9.2. Canva Pro',
                      value: custoFixo * 0.005,
                      percentage: (custoFixo * 0.005 / receita) * 100,
                      isExpandable: false,
                      isExpanded: false
                    },
                    {
                      id: '4.1.3.9.3',
                      level: 4,
                      name: '4.1.3.9.3. Meu Assessor Pro',
                      value: custoFixo * 0.01,
                      percentage: (custoFixo * 0.01 / receita) * 100,
                      isExpandable: false,
                      isExpanded: false
                    },
                    {
                      id: '4.1.3.9.4',
                      level: 4,
                      name: '4.1.3.9.4. Lovable Pro',
                      value: custoFixo * 0.005,
                      percentage: (custoFixo * 0.005 / receita) * 100,
                      isExpandable: false,
                      isExpanded: false
                    }
                  ]
                },
                {
                  id: '4.1.3.10',
                  level: 3,
                  name: '4.1.3.10. Assessorias',
                  value: custoFixo * 0.025,
                  percentage: (custoFixo * 0.025 / receita) * 100,
                  isExpandable: true,
                  isExpanded: expandedItems.has('4.1.3.10'),
                  children: [
                    {
                      id: '4.1.3.10.1',
                      level: 4,
                      name: '4.1.3.10.1. Contabilidade',
                      value: custoFixo * 0.025,
                      percentage: (custoFixo * 0.025 / receita) * 100,
                      isExpandable: false,
                      isExpanded: false
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: '4.2',
          level: 1,
          name: '4.2. DESPESAS COM VENDAS',
          value: custoFixo * 0.15,
          percentage: (custoFixo * 0.15 / receita) * 100,
          isExpandable: true,
          isExpanded: expandedItems.has('4.2'),
          children: [
            {
              id: '4.2.1',
              level: 2,
              name: '4.2.1. Gasolina',
              value: custoFixo * 0.05,
              percentage: (custoFixo * 0.05 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.2.2',
              level: 2,
              name: '4.2.2. Seguro',
              value: custoFixo * 0.03,
              percentage: (custoFixo * 0.03 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.2.3',
              level: 2,
              name: '4.2.3. Multas',
              value: custoFixo * 0.01,
              percentage: (custoFixo * 0.01 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.2.4',
              level: 2,
              name: '4.2.4. Estacionamento',
              value: custoFixo * 0.02,
              percentage: (custoFixo * 0.02 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.2.5',
              level: 2,
              name: '4.2.5. Uber',
              value: custoFixo * 0.015,
              percentage: (custoFixo * 0.015 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.2.6',
              level: 2,
              name: '4.2.6. Outros Gastos com Logística',
              value: custoFixo * 0.025,
              percentage: (custoFixo * 0.025 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            }
          ]
        },
        {
          id: '4.3',
          level: 1,
          name: '4.3. DESPESAS FINANCEIRAS',
          value: custoAdm,
          percentage: (custoAdm / receita) * 100,
          isExpandable: true,
          isExpanded: expandedItems.has('4.3'),
          children: [
            {
              id: '4.3.1',
              level: 2,
              name: '4.3.1. Juros',
              value: custoAdm * 0.3,
              percentage: (custoAdm * 0.3 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.3.2',
              level: 2,
              name: '4.3.2. Depreciação',
              value: custoAdm * 0.25,
              percentage: (custoAdm * 0.25 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.3.3',
              level: 2,
              name: '4.3.3. Provisionamentos',
              value: custoAdm * 0.2,
              percentage: (custoAdm * 0.2 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.3.4',
              level: 2,
              name: '4.3.4. Despesas Administrativas',
              value: custoAdm * 0.15,
              percentage: (custoAdm * 0.15 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            },
            {
              id: '4.3.5',
              level: 2,
              name: '4.3.5. Receitas Financeiras (+)',
              value: custoAdm * 0.1,
              percentage: (custoAdm * 0.1 / receita) * 100,
              isExpandable: false,
              isExpanded: false
            }
          ]
        }
      ]
    },
    {
      id: '5',
      level: 0,
      name: '5. LUCRO OPERACIONAL',
      value: lucroOperacional,
      percentage: (lucroOperacional / receita) * 100,
      isExpandable: false,
      isExpanded: false,
      isSubtotal: true
    },
    {
      id: '6',
      level: 0,
      name: '6. RESULTADO LÍQUIDO',
      value: resultadoLiquido,
      percentage: (resultadoLiquido / receita) * 100,
      isExpandable: false,
      isExpanded: false,
      isTotal: true
    }
  ];

  const renderDREItem = (item: DREItem): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    
    const paddingLeft = item.level * 20;
    const rowClass = item.isTotal ? 'bg-blue-50 font-bold border-t-2 border-blue-200' 
                   : item.isSubtotal ? 'bg-green-50 font-semibold border-t border-green-200'
                   : item.level === 0 ? 'bg-slate-50 font-medium'
                   : '';

    nodes.push(
      <TableRow key={item.id} className={rowClass}>
        <TableCell style={{ paddingLeft: paddingLeft + 12 }}>
          <div className="flex items-center gap-2">
            {item.isExpandable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand(item.id)}
                className="h-6 w-6 p-0 hover:bg-slate-200"
              >
                {item.isExpanded ? 
                  <ChevronDown className="h-3 w-3" /> : 
                  <ChevronRight className="h-3 w-3" />
                }
              </Button>
            )}
            <span className={item.level === 0 ? 'font-semibold' : ''}>{item.name}</span>
          </div>
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatCurrency(item.value)}
        </TableCell>
        <TableCell className="text-right font-mono">
          {formatPercent(item.percentage)}
        </TableCell>
      </TableRow>
    );

    if (item.isExpanded && item.children) {
      item.children.forEach(child => {
        nodes.push(...renderDREItem(child));
      });
    }

    return nodes;
  };

  const exportData = () => {
    const flattenItems = (items: DREItem[]): any[] => {
      const result: any[] = [];
      items.forEach(item => {
        result.push({
          'Categoria': item.name,
          'Valor': formatCurrency(item.value),
          '% s/ Receita': formatPercent(item.percentage)
        });
        if (item.children) {
          result.push(...flattenItems(item.children));
        }
      });
      return result;
    };

    const data = flattenItems(dreStructure);
    const csvContent = [
      Object.keys(data[0] || {}).join(','),
      ...data.map(row => Object.values(row).join(','))
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
              <TableHead className="text-right font-bold">Valor (R$)</TableHead>
              <TableHead className="text-right font-bold">% s/ Receita</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dreStructure.map(item => renderDREItem(item)).flat()}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground mt-4 print:hidden">
        <p>💡 Utilize os ícones de expansão para visualizar os detalhes de cada categoria</p>
        <p>📊 Os percentuais são calculados com base na Receita Operacional total</p>
      </div>
    </div>
  );
}
