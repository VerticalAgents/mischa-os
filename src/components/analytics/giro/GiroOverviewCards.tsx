import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, Target, DollarSign } from 'lucide-react';
import { GiroOverview } from '@/types/giroAnalysis';

interface GiroOverviewCardsProps {
  overview: GiroOverview;
}

export function GiroOverviewCards({ overview }: GiroOverviewCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Clientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalClientes}</div>
          <p className="text-xs text-muted-foreground">
            Clientes ativos no sistema
          </p>
        </CardContent>
      </Card>

      {/* Giro Médio Geral */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Giro Médio</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.giroMedioGeral}</div>
          <p className="text-xs text-muted-foreground">
            Unidades/semana
          </p>
        </CardContent>
      </Card>

      {/* Taxa de Atingimento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Achievement</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.taxaAtingimentoGlobal}%</div>
          <p className="text-xs text-muted-foreground">
            Média do atingimento de metas
          </p>
        </CardContent>
      </Card>

      {/* Faturamento Previsto */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Faturamento Previsto</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(overview.faturamentoTotalPrevisto)}
          </div>
          <p className="text-xs text-muted-foreground">
            Semanal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
