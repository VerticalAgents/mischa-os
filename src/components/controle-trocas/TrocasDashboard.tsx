import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTrocasStore, TrocasEstatisticas } from "@/hooks/useTrocasStore";
import { Package, CalendarDays, TrendingDown, TrendingUp, Award } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d'];

export default function TrocasDashboard() {
  const { estatisticas, loading, carregarEstatisticas } = useTrocasStore();

  useEffect(() => {
    carregarEstatisticas();
  }, [carregarEstatisticas]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!estatisticas) return null;

  const variacao = estatisticas.trocasMesAnterior > 0 
    ? Math.round(((estatisticas.trocasMes - estatisticas.trocasMesAnterior) / estatisticas.trocasMesAnterior) * 100)
    : 0;

  const topMotivo = estatisticas.porMotivo[0];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Trocas</p>
                <p className="text-2xl font-bold">{estatisticas.totalTrocas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <CalendarDays className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Este Mês</p>
                <p className="text-2xl font-bold">{estatisticas.trocasMes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Award className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Motivo</p>
                <p className="text-lg font-bold">{topMotivo?.motivo || '-'}</p>
                <p className="text-xs text-muted-foreground">{topMotivo?.percentual || 0}% das trocas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${variacao > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                {variacao > 0 ? (
                  <TrendingUp className="h-6 w-6 text-red-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tendência</p>
                <p className={`text-2xl font-bold ${variacao > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {variacao > 0 ? '+' : ''}{variacao}%
                </p>
                <p className="text-xs text-muted-foreground">vs mês anterior</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Motivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estatisticas.porMotivo}
                    dataKey="quantidade"
                    nameKey="motivo"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ motivo, percentual }) => `${motivo} (${percentual}%)`}
                    animationDuration={0}
                  >
                    {estatisticas.porMotivo.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estatisticas.evolucaoMensal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" name="Unidades Trocadas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
