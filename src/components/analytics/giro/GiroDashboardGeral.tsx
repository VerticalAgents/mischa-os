import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Area,
  ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Target } from 'lucide-react';
import { useGiroDashboardGeral } from '@/hooks/useGiroDashboardGeral';

export function GiroDashboardGeral() {
  const { data, isLoading, error } = useGiroDashboardGeral();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="h-96"></CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            Erro ao carregar dados: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const { historicoSemanas, ultimas4Semanas, mediaGeral } = data;

  // Preparar dados para o gráfico
  const chartData = historicoSemanas.map(sem => ({
    semana: sem.semana,
    'Giro Real': sem.giroReal,
    'Giro Agendado': sem.giroAgendado || 0,
    'Giro Total': sem.giroReal + (sem.giroAgendado || 0),
    'Média Histórica': Math.round(sem.mediaHistorica),
  }));

  const getTendenciaIcon = () => {
    switch (ultimas4Semanas.tendencia) {
      case 'crescimento':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'queda':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTendenciaColor = () => {
    switch (ultimas4Semanas.tendencia) {
      case 'crescimento':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'queda':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2">{data.semana}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Giro Real: <span className="font-semibold">{data['Giro Real']}</span>
            </p>
            {data['Giro Agendado'] > 0 && (
              <p className="text-purple-600">
                Giro Agendado: <span className="font-semibold">{data['Giro Agendado']}</span>
              </p>
            )}
            <p className="text-primary">
              Total: <span className="font-semibold">{data['Giro Total']}</span>
            </p>
            <p className="text-muted-foreground">
              Média Histórica: <span className="font-semibold">{data['Média Histórica']}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Total Últimas 4 Semanas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(ultimas4Semanas.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Inclui agendamentos da semana atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Média Últimas 4 Semanas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(ultimas4Semanas.media)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média semanal recente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {getTendenciaIcon()}
              Variação Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {ultimas4Semanas.variacao > 0 ? '+' : ''}
                {ultimas4Semanas.variacao.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs. média 3 semanas anteriores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Tendência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${getTendenciaColor()} text-sm px-3 py-1`}>
              {ultimas4Semanas.tendencia === 'crescimento' ? 'Crescimento' :
               ultimas4Semanas.tendencia === 'queda' ? 'Queda' : 'Estável'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado nas últimas 4 semanas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Giro Semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Giro Semanal - Últimas 12 Semanas
          </CardTitle>
          <CardDescription>
            Evolução do giro semanal baseado no histórico real de entregas com média histórica.
            <span className="text-purple-600 font-medium"> A semana atual inclui entregas agendadas.</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis 
                  dataKey="semana"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Quantidade', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                
                {/* Linha de média histórica pontilhada */}
                <Line
                  type="monotone"
                  dataKey="Média Histórica"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={false}
                />
                
                {/* Linha de giro real */}
                <Line
                  type="monotone"
                  dataKey="Giro Real"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                
                {/* Área de giro agendado (apenas última semana) */}
                <Area
                  type="monotone"
                  dataKey="Giro Agendado"
                  fill="hsl(var(--purple-500) / 0.2)"
                  stroke="hsl(var(--purple-600))"
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-primary"></div>
              <span>Giro Semanal (Real)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-purple-600 border-dashed"></div>
              <span>Giro Agendado (Semana Atual)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
              <span>Média Histórica</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
