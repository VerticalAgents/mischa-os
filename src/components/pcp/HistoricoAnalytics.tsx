import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductionAnalytics } from "@/hooks/useProductionAnalytics";
import { TrendingUp, TrendingDown, Package, Calendar } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subYears } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function HistoricoAnalytics() {
  const hoje = new Date();
  const inicioMesAtual = startOfMonth(hoje);
  const fimMesAtual = endOfMonth(hoje);
  
  const inicioTresMeses = startOfMonth(subMonths(hoje, 2));
  
  // Mês atual
  const { kpis: kpisMesAtual } = useProductionAnalytics({
    startDate: inicioMesAtual,
    endDate: fimMesAtual,
    aggregation: 'day',
  });

  // Últimos 3 meses
  const { kpis: kpisTresMeses } = useProductionAnalytics({
    startDate: inicioTresMeses,
    endDate: fimMesAtual,
    aggregation: 'month',
  });

  // Mesmo mês ano passado
  const mesmoMesAnoPassado = subYears(hoje, 1);
  const inicioMesmoMesAnoPassado = startOfMonth(mesmoMesAnoPassado);
  const fimMesmoMesAnoPassado = endOfMonth(mesmoMesAnoPassado);
  
  const { kpis: kpisMesmoMesAnoPassado } = useProductionAnalytics({
    startDate: inicioMesmoMesAnoPassado,
    endDate: fimMesmoMesAnoPassado,
    aggregation: 'day',
  });

  // Mês anterior para calcular variação
  const mesAnterior = subMonths(hoje, 1);
  const inicioMesAnterior = startOfMonth(mesAnterior);
  const fimMesAnterior = endOfMonth(mesAnterior);
  
  const { kpis: kpisMesAnterior } = useProductionAnalytics({
    startDate: inicioMesAnterior,
    endDate: fimMesAnterior,
    aggregation: 'day',
  });

  // Cálculos de variação
  const variacaoMesAnterior = kpisMesAnterior.totalUnitsProduced > 0
    ? ((kpisMesAtual.totalUnitsProduced - kpisMesAnterior.totalUnitsProduced) / kpisMesAnterior.totalUnitsProduced) * 100
    : 0;

  const variacaoAnoAnterior = kpisMesmoMesAnoPassado.totalUnitsProduced > 0
    ? ((kpisMesAtual.totalUnitsProduced - kpisMesmoMesAnoPassado.totalUnitsProduced) / kpisMesmoMesAnoPassado.totalUnitsProduced) * 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Produção Últimos 3 Meses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produção Últimos 3 Meses
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisTresMeses.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(inicioTresMeses, "MMM", { locale: ptBR })} - {format(fimMesAtual, "MMM yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {/* Produção Mês Atual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produção Mês Atual
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisMesAtual.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {variacaoMesAnterior >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={variacaoMesAnterior >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(variacaoMesAnterior).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Comparação Ano Anterior */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              vs {format(mesmoMesAnoPassado, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisMesmoMesAnoPassado.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {variacaoAnoAnterior >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={variacaoAnoAnterior >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(variacaoAnoAnterior).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">de diferença</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card com detalhes adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Produção</CardTitle>
          <CardDescription>
            Análise comparativa dos últimos períodos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Confirmação (Últimos 3 meses)</p>
                <p className="text-2xl font-bold">{kpisTresMeses.confirmationRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rendimento Médio (Últimos 3 meses)</p>
                <p className="text-2xl font-bold">{kpisTresMeses.averageYield.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
