
import StatsTable from '@/components/dashboard/StatsTable';
import { Badge } from '@/components/ui/badge';

interface CustosTableProps {
  precosDetalhados: any[];
  isCategoriaRevenda: (categoriaNome: string) => boolean;
}

export default function CustosTable({
  precosDetalhados,
  isCategoriaRevenda
}: CustosTableProps) {
  const calcularCustoInsumo = (item: any): number => {
    const categoria = item.categoriaNome.toLowerCase();
    let percentualCusto = 0.42; // 42% padrão
    
    if (categoria.includes('revenda') || categoria.includes('padrão')) {
      percentualCusto = 0.31; // 31% para revenda
    }
    
    return item.faturamentoSemanal * percentualCusto;
  };

  const calcularCustoLogistico = (item: any): number => {
    // Assumindo 3.8% de custo logístico baseado nos dados da página
    return item.faturamentoSemanal * 0.038;
  };

  const calcularImpostos = (item: any): number => {
    // Assumindo 2.1% de impostos baseado nos dados da página
    return item.faturamentoSemanal * 0.021;
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
      header: 'Custo Insumos (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => `R$ ${calcularCustoInsumo(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Custo Logística (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => `R$ ${calcularCustoLogistico(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Impostos (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => `R$ ${calcularImpostos(item).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Total Custos (Sem.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => {
        const totalCustos = calcularCustoInsumo(item) + calcularCustoLogistico(item) + calcularImpostos(item);
        return (
          <span className="font-semibold text-red-600">
            R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    },
    {
      header: 'Total Custos (Mens.)',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => {
        const totalCustos = (calcularCustoInsumo(item) + calcularCustoLogistico(item) + calcularImpostos(item)) * 4;
        return (
          <span className="font-semibold text-red-600">
            R$ {totalCustos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        );
      }
    }
  ];

  return (
    <StatsTable
      data={precosDetalhados}
      columns={columns}
      title="Custos por Cliente"
      description="Detalhamento dos custos por cliente (insumos, logística e impostos)"
    />
  );
}
