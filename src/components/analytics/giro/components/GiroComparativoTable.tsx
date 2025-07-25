
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface GiroComparativoTableProps {
  dados: DadosAnaliseGiroConsolidados[];
}

export function GiroComparativoTable({ dados }: GiroComparativoTableProps) {
  const calcularGiroProjetado = (item: DadosAnaliseGiroConsolidados): number => {
    if (!item.quantidade_padrao || !item.periodicidade_padrao) return 0;
    return Math.round((item.quantidade_padrao / item.periodicidade_padrao) * 7);
  };

  const getStatusAjuste = (historico: number, projetado: number) => {
    if (projetado === 0) return { status: 'indefinido', cor: 'bg-gray-100 text-gray-800' };
    
    const diferenca = ((historico - projetado) / projetado) * 100;
    
    if (diferenca >= -10 && diferenca <= 10) {
      return { status: 'ajustado', cor: 'bg-green-100 text-green-800' };
    } else if (diferenca > 10) {
      return { status: 'acima', cor: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'abaixo', cor: 'bg-red-100 text-red-800' };
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          <TableHead>Representante</TableHead>
          <TableHead className="text-right">Giro Histórico (4 sem)</TableHead>
          <TableHead className="text-right">Giro Projetado</TableHead>
          <TableHead className="text-right">Diferença</TableHead>
          <TableHead className="text-center">Progresso</TableHead>
          <TableHead className="text-center">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((item) => {
          const giroProjetado = calcularGiroProjetado(item);
          // Usar giro_medio_historico como histórico de 4 semanas (já corrigido no service)
          const giroHistorico = item.giro_medio_historico;
          const diferenca = giroProjetado > 0 ? ((giroHistorico - giroProjetado) / giroProjetado) * 100 : 0;
          const { status, cor } = getStatusAjuste(giroHistorico, giroProjetado);
          const progressValue = giroProjetado > 0 ? Math.min((giroHistorico / giroProjetado) * 100, 150) : 0;
          
          return (
            <TableRow key={item.cliente_id}>
              <TableCell className="font-medium">{item.cliente_nome}</TableCell>
              <TableCell>{item.representante_nome || '-'}</TableCell>
              <TableCell className="text-right font-mono">
                {giroHistorico.toFixed(1)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {giroProjetado.toFixed(1)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {diferenca > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : diferenca < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-mono">
                    {diferenca > 0 ? '+' : ''}{diferenca.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center gap-2">
                  <Progress 
                    value={progressValue} 
                    className="w-16 h-2"
                  />
                  <span className="text-xs font-mono">
                    {progressValue.toFixed(0)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="secondary" className={cor}>
                  {status}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
