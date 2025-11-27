import { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useGiroDashboardGeral } from '@/hooks/useGiroDashboardGeral';
import { useNavigate } from 'react-router-dom';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const giroTotal = data['Giro Real'];
    const mediaHistorica = data['Média Histórica'];
    const diffVsMedia = mediaHistorica > 0 
      ? ((giroTotal / mediaHistorica - 1) * 100).toFixed(1)
      : '0';
    
    return (
      <div className="bg-card border-2 rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="font-semibold mb-1 text-sm">{data.periodoInicio}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Giro:</span>
            <span className="font-bold">{giroTotal}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {parseFloat(diffVsMedia) >= 0 ? '+' : ''}{diffVsMedia}% vs média
          </div>
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

const LoadingState = memo(() => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-48" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[250px] w-full" />
    </CardContent>
  </Card>
));

LoadingState.displayName = 'LoadingState';

export default function HomeGiroSemanalChart() {
  const navigate = useNavigate();
  const { dados, loading, error } = useGiroDashboardGeral();

  const chartData = useMemo(() => {
    if (!dados) return [];
    return dados.historicoSemanas.map((sem: any) => ({
      semana: sem.semana,
      periodoInicio: sem.periodoInicio,
      'Giro Real': sem.giroReal + (sem.giroAgendado || 0),
      'Média Histórica': Math.round(dados.mediaGeral)
    }));
  }, [dados]);

  const getTendenciaInfo = useMemo(() => {
    if (!dados) return null;
    const tipo = dados.tendencia12Semanas?.tipo;
    if (tipo === 'crescimento') return { icon: TrendingUp, text: 'Crescimento', color: 'bg-green-600 text-white' };
    if (tipo === 'queda') return { icon: TrendingDown, text: 'Queda', color: 'bg-red-600 text-white' };
    return { icon: Minus, text: 'Estável', color: 'bg-muted text-muted-foreground' };
  }, [dados]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar giro semanal</AlertDescription>
      </Alert>
    );
  }

  if (!dados) return null;

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() => navigate('/gestao-comercial?tab=analise-giro')}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Giro Semanal - 12 Semanas
          </CardTitle>
          {getTendenciaInfo && (
            <Badge className={getTendenciaInfo.color}>
              <getTendenciaInfo.icon className="h-3 w-3 mr-1" />
              {getTendenciaInfo.text}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart 
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="semana" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Line
              type="monotone"
              dataKey="Média Histórica"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
            
            <Line
              type="monotone"
              dataKey="Giro Real"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        
        <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-muted-foreground">
          <span>Média histórica: {Math.round(dados.mediaGeral)}</span>
          <span>Projetado: {dados.giroProjetado}</span>
        </div>
      </CardContent>
    </Card>
  );
}
