
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface TopClientesCardsProps {
  dados: DadosAnaliseGiroConsolidados[];
}

export function TopClientesCards({ dados }: TopClientesCardsProps) {
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {dados.slice(0, 3).map((item, index) => (
        <Card key={item.cliente_id} className="relative">
          <div className="absolute top-4 right-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
              index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
            }`}>
              {index + 1}
            </div>
          </div>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{item.cliente_nome}</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{item.giro_semanal_calculado.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">un/semana</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {getTrendIcon(item.variacao_percentual)}
                  <span className="text-sm font-medium">
                    {item.variacao_percentual > 0 ? '+' : ''}{item.variacao_percentual.toFixed(1)}%
                  </span>
                </div>
                {getPerformanceBadge(item.semaforo_performance)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
