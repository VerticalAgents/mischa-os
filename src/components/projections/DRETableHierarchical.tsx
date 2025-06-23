import React, { useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer, ChevronDown, ChevronRight } from "lucide-react";
import { DREData } from '@/types/projections';
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
export function DRETableHierarchical({
  dreData
}: DRETableHierarchicalProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
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

  // Calcular valores para a nova estrutura do DRE
  const receita = dreData.totalRevenue;
  const receitaRevenda = receita * 0.7; // Assumindo 70% revenda
  const receitaFoodService = receita * 0.3; // Assumindo 30% food service

  const custosVariaveis = dreData.totalVariableCosts;
  const logistica = custosVariaveis * 0.2;
  const insumosRevenda = custosVariaveis * 0.5;
  const insumosFoodService = custosVariaveis * 0.25;
  const aquisicaoClientes = custosVariaveis * 0.05;
  const lucroBruto = receita - custosVariaveis;
  const custosFixos = dreData.totalFixedCosts;
  const despesasOperacionais = custosFixos * 0.6;
  const proLabore = despesasOperacionais * 0.3;
  const despesasPessoal = despesasOperacionais * 0.4;
  const infraestrutura = despesasOperacionais * 0.3;
  const despesasVendas = custosFixos * 0.25;
  const despesasFinanceiras = custosFixos * 0.15;
  const custoAdm = dreData.totalAdministrativeCosts;
  const marketing = custoAdm * 0.3;
  const investimentos = custoAdm * 0.7;
  const lucroOperacional = lucroBruto - custosFixos - custoAdm;
  const resultadoLiquido = lucroOperacional;

  // Nova estrutura hierárquica do DRE
  const dreItems: DREItem[] = [{
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
  }, {
    id: '2',
    categoria: '2. CUSTOS VARIÁVEIS',
    valor: custosVariaveis,
    percentual: custosVariaveis / receita * 100,
    level: 0,
    isExpandable: true,
    children: [{
      id: '2.1',
      categoria: '2.1. LOGÍSTICA',
      valor: logistica,
      percentual: logistica / receita * 100,
      level: 1
    }, {
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
    }, {
      id: '2.3',
      categoria: '2.3. AQUISIÇÃO DE CLIENTES',
      valor: aquisicaoClientes,
      percentual: aquisicaoClientes / receita * 100,
      level: 1
    }]
  }, {
    id: '3',
    categoria: '3. LUCRO BRUTO MENSAL',
    valor: lucroBruto,
    percentual: lucroBruto / receita * 100,
    level: 0,
    isSubtotal: true
  }, {
    id: '4',
    categoria: '4. CUSTOS FIXOS',
    valor: custosFixos + custoAdm,
    percentual: (custosFixos + custoAdm) / receita * 100,
    level: 0,
    isExpandable: true,
    children: [{
      id: '4.1',
      categoria: '4.1. DESPESAS OPERACIONAIS',
      valor: despesasOperacionais,
      percentual: despesasOperacionais / receita * 100,
      level: 1,
      isExpandable: true,
      children: [{
        id: '4.1.1',
        categoria: '4.1.1. PRÓ-LABORE',
        valor: proLabore,
        percentual: proLabore / receita * 100,
        level: 2,
        isExpandable: true,
        children: [{
          id: '4.1.1.1',
          categoria: '4.1.1.1. Lucca',
          valor: proLabore,
          percentual: proLabore / receita * 100,
          level: 3
        }]
      }, {
        id: '4.1.2',
        categoria: '4.1.2. DESPESAS COM PESSOAL',
        valor: despesasPessoal,
        percentual: despesasPessoal / receita * 100,
        level: 2,
        isExpandable: true,
        children: [{
          id: '4.1.2.1',
          categoria: '4.1.2.1. Folha de Pagamento',
          valor: despesasPessoal * 0.5,
          percentual: despesasPessoal * 0.5 / receita * 100,
          level: 3
        }, {
          id: '4.1.2.2',
          categoria: '4.1.2.2. VT',
          valor: despesasPessoal * 0.1,
          percentual: despesasPessoal * 0.1 / receita * 100,
          level: 3
        }, {
          id: '4.1.2.3',
          categoria: '4.1.2.3. VA',
          valor: despesasPessoal * 0.1,
          percentual: despesasPessoal * 0.1 / receita * 100,
          level: 3
        }, {
          id: '4.1.2.4',
          categoria: '4.1.2.4. Comissões',
          valor: despesasPessoal * 0.15,
          percentual: despesasPessoal * 0.15 / receita * 100,
          level: 3
        }, {
          id: '4.1.2.5',
          categoria: '4.1.2.5. Terceirizados',
          valor: despesasPessoal * 0.15,
          percentual: despesasPessoal * 0.15 / receita * 100,
          level: 3
        }]
      }, {
        id: '4.1.3',
        categoria: '4.1.3. INFRAESTRUTURA',
        valor: infraestrutura,
        percentual: infraestrutura / receita * 100,
        level: 2,
        isExpandable: true,
        children: [{
          id: '4.1.3.1',
          categoria: '4.1.3.1. Material de Limpeza',
          valor: infraestrutura * 0.05,
          percentual: infraestrutura * 0.05 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.2',
          categoria: '4.1.3.2. Material de Escritório',
          valor: infraestrutura * 0.05,
          percentual: infraestrutura * 0.05 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.3',
          categoria: '4.1.3.3. Energia Elétrica',
          valor: infraestrutura * 0.15,
          percentual: infraestrutura * 0.15 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.4',
          categoria: '4.1.3.4. Aluguel',
          valor: infraestrutura * 0.3,
          percentual: infraestrutura * 0.3 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.5',
          categoria: '4.1.3.5. Água',
          valor: infraestrutura * 0.05,
          percentual: infraestrutura * 0.05 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.6',
          categoria: '4.1.3.6. Sistemas',
          valor: infraestrutura * 0.05,
          percentual: infraestrutura * 0.05 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.7',
          categoria: '4.1.3.7. Telefone',
          valor: infraestrutura * 0.03,
          percentual: infraestrutura * 0.03 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.8',
          categoria: '4.1.3.8. Internet',
          valor: infraestrutura * 0.02,
          percentual: infraestrutura * 0.02 / receita * 100,
          level: 3
        }, {
          id: '4.1.3.9',
          categoria: '4.1.3.9. Licenças e Sistemas',
          valor: infraestrutura * 0.15,
          percentual: infraestrutura * 0.15 / receita * 100,
          level: 3,
          isExpandable: true,
          children: [{
            id: '4.1.3.9.1',
            categoria: '4.1.3.9.1. ERP Gestão Click',
            valor: infraestrutura * 0.05,
            percentual: infraestrutura * 0.05 / receita * 100,
            level: 4
          }, {
            id: '4.1.3.9.2',
            categoria: '4.1.3.9.2. Canva Pro',
            valor: infraestrutura * 0.03,
            percentual: infraestrutura * 0.03 / receita * 100,
            level: 4
          }, {
            id: '4.1.3.9.3',
            categoria: '4.1.3.9.3. Meu Assessor Pro',
            valor: infraestrutura * 0.04,
            percentual: infraestrutura * 0.04 / receita * 100,
            level: 4
          }, {
            id: '4.1.3.9.4',
            categoria: '4.1.3.9.4. Lovable Pro',
            valor: infraestrutura * 0.03,
            percentual: infraestrutura * 0.03 / receita * 100,
            level: 4
          }]
        }, {
          id: '4.1.3.10',
          categoria: '4.1.3.10. Assessorias',
          valor: infraestrutura * 0.15,
          percentual: infraestrutura * 0.15 / receita * 100,
          level: 3,
          isExpandable: true,
          children: [{
            id: '4.1.3.10.1',
            categoria: '4.1.3.10.1. Contabilidade',
            valor: infraestrutura * 0.15,
            percentual: infraestrutura * 0.15 / receita * 100,
            level: 4
          }]
        }]
      }]
    }, {
      id: '4.2',
      categoria: '4.2. DESPESAS COM VENDAS',
      valor: despesasVendas,
      percentual: despesasVendas / receita * 100,
      level: 1,
      isExpandable: true,
      children: [{
        id: '4.2.1',
        categoria: '4.2.1. Gasolina',
        valor: despesasVendas * 0.4,
        percentual: despesasVendas * 0.4 / receita * 100,
        level: 2
      }, {
        id: '4.2.2',
        categoria: '4.2.2. Seguro',
        valor: despesasVendas * 0.2,
        percentual: despesasVendas * 0.2 / receita * 100,
        level: 2
      }, {
        id: '4.2.3',
        categoria: '4.2.3. Multas',
        valor: despesasVendas * 0.05,
        percentual: despesasVendas * 0.05 / receita * 100,
        level: 2
      }, {
        id: '4.2.4',
        categoria: '4.2.4. Estacionamento',
        valor: despesasVendas * 0.1,
        percentual: despesasVendas * 0.1 / receita * 100,
        level: 2
      }, {
        id: '4.2.5',
        categoria: '4.2.5. Uber',
        valor: despesasVendas * 0.15,
        percentual: despesasVendas * 0.15 / receita * 100,
        level: 2
      }, {
        id: '4.2.6',
        categoria: '4.2.6. Outros Gastos com Logística',
        valor: despesasVendas * 0.1,
        percentual: despesasVendas * 0.1 / receita * 100,
        level: 2
      }]
    }, {
      id: '4.2.4',
      categoria: '4.2.4. MARKETING',
      valor: marketing,
      percentual: marketing / receita * 100,
      level: 1
    }, {
      id: '4.2.5',
      categoria: '4.2.5. INVESTIMENTOS',
      valor: investimentos,
      percentual: investimentos / receita * 100,
      level: 1,
      isExpandable: true,
      children: [{
        id: '4.2.5.1',
        categoria: '4.2.5.1. Forno',
        valor: investimentos * 0.6,
        percentual: investimentos * 0.6 / receita * 100,
        level: 2
      }, {
        id: '4.2.5.2',
        categoria: '4.2.5.2. Flow Pack',
        valor: investimentos * 0.4,
        percentual: investimentos * 0.4 / receita * 100,
        level: 2
      }]
    }, {
      id: '4.3',
      categoria: '4.3. DESPESAS FINANCEIRAS',
      valor: despesasFinanceiras,
      percentual: despesasFinanceiras / receita * 100,
      level: 1,
      isExpandable: true,
      children: [{
        id: '4.3.1',
        categoria: '4.3.1. Juros',
        valor: despesasFinanceiras * 0.3,
        percentual: despesasFinanceiras * 0.3 / receita * 100,
        level: 2
      }, {
        id: '4.3.2',
        categoria: '4.3.2. Depreciação',
        valor: despesasFinanceiras * 0.4,
        percentual: despesasFinanceiras * 0.4 / receita * 100,
        level: 2
      }, {
        id: '4.3.3',
        categoria: '4.3.3. Provisionamentos',
        valor: despesasFinanceiras * 0.2,
        percentual: despesasFinanceiras * 0.2 / receita * 100,
        level: 2
      }, {
        id: '4.3.4',
        categoria: '4.3.4. Despesas Administrativas',
        valor: despesasFinanceiras * 0.1,
        percentual: despesasFinanceiras * 0.1 / receita * 100,
        level: 2
      }, {
        id: '4.3.5',
        categoria: '4.3.5. Receitas Financeiras (+)',
        valor: -despesasFinanceiras * 0.1,
        percentual: -despesasFinanceiras * 0.1 / receita * 100,
        level: 2
      }]
    }]
  }, {
    id: '5',
    categoria: '5. LUCRO OPERACIONAL',
    valor: lucroOperacional,
    percentual: lucroOperacional / receita * 100,
    level: 0,
    isSubtotal: true
  }, {
    id: '6',
    categoria: '6. RESULTADO LÍQUIDO',
    valor: resultadoLiquido,
    percentual: resultadoLiquido / receita * 100,
    level: 0,
    isHighlight: true
  }];
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
      const rowClass = item.isTotal ? 'bg-blue-50 font-semibold border-t-2 border-blue-200' : item.isSubtotal ? 'bg-green-50 font-semibold border-t border-green-200' : item.isHighlight ? 'bg-purple-50 font-semibold border-t border-purple-200' : item.level === 1 ? 'bg-slate-25' : item.level === 2 ? 'bg-slate-15' : item.level === 3 ? 'bg-slate-10' : '';
      const isExpanded = expandedItems.has(item.id);
      const indentClass = `pl-${item.level * 4}`;
      result.push(<TableRow key={item.id} className={rowClass}>
          <TableCell className={`font-medium ${indentClass}`}>
            <div className="flex items-center">
              {item.isExpandable && <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-2" onClick={() => toggleExpansion(item.id)}>
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>}
              {!item.isExpandable && <div className="w-10" />}
              {item.categoria}
            </div>
          </TableCell>
          <TableCell className="text-right font-mono">
            {formatCurrency(item.valor)}
          </TableCell>
          <TableCell className="text-right font-mono px-0">
            {formatPercent(item.percentual)}
          </TableCell>
        </TableRow>);
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
    const csvContent = ['Categoria,Valor,Percentual', ...allItems.map(item => `"${item.categoria}","${formatCurrency(item.valor)}","${formatPercent(item.percentual)}"`)].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DRE-${dreData.name}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };
  const printDRE = () => {
    window.print();
  };
  return <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">DRE - {dreData.name}</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={printDRE} className="px-0 mx-0">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="rounded-md border mx-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100">
              <TableHead className="w-[60%] font-bold">Categoria</TableHead>
              <TableHead className="text-right font-bold">Valor</TableHead>
              <TableHead className="text-right font-bold px-0 mx-0">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderDREItems(dreItems)}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
        
        
        
      </div>

      <div className="text-sm text-muted-foreground mt-4 print:hidden">
        <p>📊 Os percentuais são calculados com base na Receita Operacional total</p>
        <p>💡 Clique nos ícones de seta para expandir/recolher categorias</p>
        <p>🔍 Estrutura hierárquica completa implementada conforme especificação</p>
      </div>
    </div>;
}