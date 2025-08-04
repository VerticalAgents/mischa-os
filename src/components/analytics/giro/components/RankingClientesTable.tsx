import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';
import SortableTableHeader from '@/components/common/SortableTableHeader';
import { useTableSort } from '@/hooks/useTableSort';

interface RankingClientesTableProps {
  dados: DadosAnaliseGiroConsolidados[];
}

export function RankingClientesTable({ dados }: RankingClientesTableProps) {
  const { sortedData, sortConfig, requestSort } = useTableSort(dados, 'giro_medio_historico');

  const getTrendIcon = (variacao: number) => {
    if (variacao > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variacao < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getPerformanceBadge = (performance: string) => {
    const variants = {
      verde: 'bg-green-100 text-green-800',
      amarelo: 'bg-yellow-100 text-yellow-800',
      vermelho: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="secondary" className={variants[performance as keyof typeof variants]}>
        {performance}
      </Badge>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Pos.</TableHead>
          <SortableTableHeader
            sortKey="cliente_nome"
            sortConfig={sortConfig}
            onSort={requestSort}
          >
            Cliente
          </SortableTableHeader>
          <SortableTableHeader
            sortKey="representante_nome"
            sortConfig={sortConfig}
            onSort={requestSort}
          >
            Representante
          </SortableTableHeader>
          <SortableTableHeader
            sortKey="giro_medio_historico"
            sortConfig={sortConfig}
            onSort={requestSort}
            className="text-right"
          >
            Giro Histórico
          </SortableTableHeader>
          <SortableTableHeader
            sortKey="achievement_meta"
            sortConfig={sortConfig}
            onSort={requestSort}
            className="text-right"
          >
            Achievement
          </SortableTableHeader>
          <SortableTableHeader
            sortKey="variacao_percentual"
            sortConfig={sortConfig}
            onSort={requestSort}
            className="text-right"
          >
            Variação
          </SortableTableHeader>
          <SortableTableHeader
            sortKey="semaforo_performance"
            sortConfig={sortConfig}
            onSort={requestSort}
            className="text-center"
          >
            Performance
          </SortableTableHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((item, index) => (
          <TableRow key={item.cliente_id}>
            <TableCell className="font-medium">#{index + 1}</TableCell>
            <TableCell className="font-medium">{item.cliente_nome}</TableCell>
            <TableCell>{item.representante_nome || '-'}</TableCell>
            <TableCell className="text-right font-mono">
              {item.giro_medio_historico.toFixed(1)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {item.achievement_meta.toFixed(1)}%
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-1">
                {getTrendIcon(item.variacao_percentual)}
                <span className="font-mono">
                  {item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual.toFixed(1)}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-center">
              {getPerformanceBadge(item.semaforo_performance)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
