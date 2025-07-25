
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface RankingClientesTableProps {
  dados: DadosAnaliseGiroConsolidados[];
}

export function RankingClientesTable({ dados }: RankingClientesTableProps) {
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
          <TableHead>Cliente</TableHead>
          <TableHead>Representante</TableHead>
          <TableHead className="text-right">Giro Atual</TableHead>
          <TableHead className="text-right">Achievement</TableHead>
          <TableHead className="text-right">Variação</TableHead>
          <TableHead className="text-center">Performance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((item, index) => (
          <TableRow key={item.cliente_id}>
            <TableCell className="font-medium">#{index + 1}</TableCell>
            <TableCell className="font-medium">{item.cliente_nome}</TableCell>
            <TableCell>{item.representante_nome || '-'}</TableCell>
            <TableCell className="text-right font-mono">
              {item.giro_semanal_calculado.toFixed(1)}
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
