import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp } from 'lucide-react';
import { GiroOverview } from '@/types/giroAnalysis';
import TooltipExplicativo from '@/components/common/TooltipExplicativo';
import { GIRO_TOOLTIPS } from '@/data/indicadoresTooltips';

interface GiroOverviewCardsProps {
  overview: GiroOverview;
  totalClientes?: number;
  clientesAtivos?: number;
}

export function GiroOverviewCards({ overview, totalClientes, clientesAtivos }: GiroOverviewCardsProps) {
  // Usar clientesAtivos passado ou fallback para overview.totalClientes
  const ativos = clientesAtivos ?? overview.totalClientes;
  const total = totalClientes ?? overview.totalClientes;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Clientes Ativos */}
      <TooltipExplicativo explicacao={GIRO_TOOLTIPS.clientesAtivos} variant="indicator">
        <Card className="cursor-help hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ativos}</div>
            <p className="text-xs text-muted-foreground">
              ({total} total)
            </p>
          </CardContent>
        </Card>
      </TooltipExplicativo>

      {/* Giro Médio Geral */}
      <TooltipExplicativo explicacao={GIRO_TOOLTIPS.giroMedioPorPDV} variant="indicator">
        <Card className="cursor-help hover:shadow-md transition-all duration-200">
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
      </TooltipExplicativo>
    </div>
  );
}
