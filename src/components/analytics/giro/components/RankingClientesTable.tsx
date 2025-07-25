
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Trophy, Award, Medal } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface RankingClientesTableProps {
  dados: DadosAnaliseGiroConsolidados[];
}

export function RankingClientesTable({ dados }: RankingClientesTableProps) {
  const getRankingIcon = (posicao: number) => {
    if (posicao === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (posicao === 2) return <Award className="h-4 w-4 text-gray-400" />;
    if (posicao === 3) return <Medal className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-medium">{posicao}</span>;
  };

  const getTendenciaIcon = (variacao: number) => {
    if (variacao > 5) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (variacao < -5) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Posição</TableHead>
          <TableHead>Cliente</TableHead>
          <TableHead>Representante</TableHead>
          <TableHead className="text-right">Giro Histórico Correto</TableHead>
          <TableHead className="text-right">Variação %</TableHead>
          <TableHead className="text-right">Achievement</TableHead>
          <TableHead className="text-center">Performance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((item, index) => {
          const posicao = index + 1;
          
          return (
            <TableRow key={item.cliente_id}>
              <TableCell className="text-center">
                {getRankingIcon(posicao)}
              </TableCell>
              <TableCell className="font-medium">{item.cliente_nome}</TableCell>
              <TableCell>{item.representante_nome || '-'}</TableCell>
              <TableCell className="text-right font-mono font-semibold">
                {item.giro_medio_historico.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {getTendenciaIcon(item.variacao_percentual)}
                  <span className="font-mono">
                    {item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {item.achievement_meta.toFixed(0)}%
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  variant="secondary" 
                  className={
                    item.semaforo_performance === 'verde' ? 'bg-green-100 text-green-800' :
                    item.semaforo_performance === 'amarelo' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }
                >
                  {item.semaforo_performance}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
