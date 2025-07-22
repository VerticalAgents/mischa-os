
import StatsTable from '@/components/dashboard/StatsTable';
import { Badge } from '@/components/ui/badge';

interface ResultadosTableProps {
  precosDetalhados: any[];
  isCategoriaRevenda: (categoriaNome: string) => boolean;
}

export default function ResultadosTable({
  precosDetalhados,
  isCategoriaRevenda
}: ResultadosTableProps) {
  const calcularCustoInsumo = (item: any): number => {
    const categoria = item.categoriaNome.toLowerCase();
    let percentualCusto = 0.42; // 42% padrão
    
    if (categoria.includes('revenda') || categoria.includes('padrão')) {
      percentualCusto = 0.31; // 31% para revenda
    }
    
    return item.faturamentoSemanal * percentualCusto;
  };

  const calcularCustoLogistico = (item: any): number => {
    return item.faturamentoSemanal * 0.038; // 3.8%
  };

  const calcularImpostos = (item: any): number => {
    return item.faturamentoSemanal * 0.021; // 2.1%
  };

  const calcularLucroBruto = (item: any): number => {
    const totalCustos = calcularCustoInsumo(item) + calcularCustoLogistico(item) + calcularImpostos(item);
    return item.faturamentoSemanal - totalCustos;
  };

  const calcularMargemBruta = (item: any): number => {
    const lucroBruto = calcularLucroBruto(item);
    return item.faturamentoSemanal > 0 ? (lucroBruto / item.faturamentoSemanal) * 100 : 0;
  };

  const columns = [
    {
      header: 'Cliente',
      accessorKey: 'clienteNome' as keyof any,
      cell: (item: any) => <span className="font-medium">{item.clienteNome}</span>
    },
    {
      header: 'Categoria',
      accessorKey: 'categoriaNome' as keyof any,
      cell: (item: any) => (
        <Badge variant={isCategoriaRevenda(item.categoriaNome) ? "default" : "secondary"}>
          {item.categoriaNome}
        </Badge>
      )
    },
    {
      header: 'Faturamento (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => `R$ ${item.faturamentoSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Custos Totais (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => {
        const totalCustos = calcularCustoInsumo(item) + calcularCustoLogistico(item) + calcularImpostos(item);
        return `R$ ${totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
      }
    },
    {
      header: 'Lucro Bruto (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => {
        const lucroBruto = calcularLucroBruto(item);
        return (
          <span className={`font-semibold ${lucroBruto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {lucroBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      header: 'Margem Bruta (%)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => {
        const margem = calcularMargemBruta(item);
        return (
          <span className={`font-semibold ${margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {margem.toFixed(1)}%
          </span>
        );
      }
    },
    {
      header: 'Lucro Bruto (Mens.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => {
        const lucroBrutoMensal = calcularLucroBruto(item) * 4;
        return (
          <span className={`font-semibold ${lucroBrutoMensal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            R$ {lucroBrutoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    }
  ];

  return (
    <StatsTable
      data={precosDetalhados}
      columns={columns}
      title="Resultados por Cliente"
      description="Análise de rentabilidade por cliente com margem bruta e lucro"
    />
  );
}
