
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, MapPin, Users, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DadosAnaliseGiroConsolidados, GiroOverview, GiroRegionalData } from '@/types/giroAnalysis';

interface GiroOverviewGeneralProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  overview?: GiroOverview;
  regional: GiroRegionalData[];
  isLoading: boolean;
}

export function GiroOverviewGeneral({ 
  dadosConsolidados, 
  overview, 
  regional,
  isLoading 
}: GiroOverviewGeneralProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Preparar dados para gráficos
  const tendenciaGeral = dadosConsolidados.reduce((acc, item) => {
    const key = item.semaforo_performance || 'indefinido';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const dadosGraficoTendencia = Object.entries(tendenciaGeral).map(([status, count]) => ({
    status,
    count,
    color: status === 'verde' ? '#10b981' : status === 'amarelo' ? '#f59e0b' : '#ef4444'
  }));

  const dadosGraficoRegional = regional.map(item => ({
    rota: item.rota_entrega,
    giro_medio: item.giro_medio,
    achievement: item.achievement_medio,
    faturamento: item.faturamento_previsto
  }));

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Performance Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Clientes em alta</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {tendenciaGeral.verde || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Atenção</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {tendenciaGeral.amarelo || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Baixa performance</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {tendenciaGeral.vermelho || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Achievement Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">
                {overview?.taxaAtingimentoGlobal.toFixed(1)}%
              </div>
              <Progress 
                value={overview?.taxaAtingimentoGlobal || 0} 
                className="h-2"
              />
              <p className="text-sm text-muted-foreground">
                Meta de 85% de achievement médio
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Giro Médio Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-3xl font-bold">
                {overview?.giroMedioGeral.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">
                unidades/semana
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-600">+5.2% vs mês anterior</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Distribuição por Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoTendencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Análise Regional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-orange-600" />
            Análise por Rota de Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {regional.map((rota, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{rota.rota_entrega}</h3>
                    <p className="text-sm text-muted-foreground">
                      {rota.total_clientes} clientes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Giro Médio</div>
                    <div className="font-semibold">{rota.giro_medio.toFixed(1)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Achievement</div>
                    <div className="font-semibold">{rota.achievement_medio.toFixed(1)}%</div>
                  </div>
                  <Badge 
                    variant={rota.performance_geral === 'verde' ? 'default' : 'secondary'}
                    className={
                      rota.performance_geral === 'verde' 
                        ? 'bg-green-100 text-green-800' 
                        : rota.performance_geral === 'amarelo'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }
                  >
                    {rota.performance_geral}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
