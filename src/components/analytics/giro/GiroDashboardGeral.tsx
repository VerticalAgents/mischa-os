import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Activity, Minus, BarChart3, Target } from "lucide-react";
import { useGiroDashboardGeral } from "@/hooks/useGiroDashboardGeral";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export function GiroDashboardGeral() {
  const { dados, loading, error } = useGiroDashboardGeral();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados do dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!dados) {
    return null;
  }

  const {
    historicoSemanas,
    ultimas4Semanas,
    mediaUltimas4,
    mediaGeral,
    variacao,
    tendencia,
    tendencia12Semanas,
    picoSemanal,
    valeSemanal,
    amplitudeVariacao,
    giroRealAtual,
    giroAgendadoAtual,
    giroProjetado,
    performanceVsMedia,
    percentualSemanaPassado,
    diasRestantes
  } = dados;

  // Preparar dados para o gráfico
  const chartData = historicoSemanas.map((sem, index) => {
    const isUltimaSemana = index === historicoSemanas.length - 1;
    const temAgendado = sem.giroAgendado && sem.giroAgendado > 0;
    
    return {
      semana: sem.semana,
      'Giro Real': sem.giroReal,
      'Giro Agendado': isUltimaSemana && temAgendado ? sem.giroAgendado : null,
      'Giro Total Projetado': isUltimaSemana && temAgendado ? sem.giroReal + (sem.giroAgendado || 0) : null,
      'Média Histórica': Math.round(mediaGeral),
      isProjecao: isUltimaSemana && temAgendado
    };
  });

  const getTendenciaIcon = (tipo: string) => {
    if (tipo === 'crescimento') return <TrendingUp className="h-4 w-4" />;
    if (tipo === 'queda') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTendenciaColor = (tipo: string) => {
    if (tipo === 'crescimento') return 'bg-green-600 text-white';
    if (tipo === 'queda') return 'bg-red-600 text-white';
    return 'bg-muted text-muted-foreground';
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isProjecao = data.isProjecao;
      
      return (
        <div className="bg-card border-2 rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-2 flex items-center gap-2">
            {data.semana}
            {isProjecao && (
              <Badge variant="secondary" className="text-xs">
                Projeção
              </Badge>
            )}
          </p>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-primary font-medium">Giro Real:</span>
              <span className="font-bold">{data['Giro Real']}</span>
            </div>
            
            {isProjecao && data['Giro Agendado'] && data['Giro Agendado'] > 0 && (
              <>
                <div className="flex justify-between gap-4">
                  <span style={{ color: 'hsl(var(--purple-600))' }}>+ Agendado:</span>
                  <span className="font-bold" style={{ color: 'hsl(var(--purple-600))' }}>
                    {data['Giro Agendado']}
                  </span>
                </div>
                <div className="border-t pt-1 mt-1 flex justify-between gap-4">
                  <span style={{ color: 'hsl(var(--purple-700))' }} className="font-medium">
                    Total Projetado:
                  </span>
                  <span className="font-bold" style={{ color: 'hsl(var(--purple-700))' }}>
                    {data['Giro Total Projetado']}
                  </span>
                </div>
              </>
            )}
            
            <div className="border-t pt-1 mt-2 flex justify-between gap-4 text-muted-foreground">
              <span>Média Histórica:</span>
              <span className="font-semibold">{data['Média Histórica']}</span>
            </div>
            
            {data['Giro Real'] > 0 && (
              <div className="text-xs pt-1">
                <span className={data['Giro Real'] >= data['Média Histórica'] ? 'text-green-600' : 'text-red-600'}>
                  {data['Giro Real'] >= data['Média Histórica'] ? '↑' : '↓'}
                  {' '}
                  {Math.abs(((data['Giro Real'] / data['Média Histórica']) - 1) * 100).toFixed(1)}%
                  {' '}vs média
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Indicadores - Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Últimas 4 Semanas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Total Últimas 4 Semanas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(ultimas4Semanas)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Apenas entregas confirmadas
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Média Últimas 4 Semanas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Média Últimas 4 Semanas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Math.round(mediaUltimas4)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {mediaUltimas4 > mediaGeral ? (
                <span className="text-green-600 font-medium">
                  +{((mediaUltimas4 / mediaGeral - 1) * 100).toFixed(1)}% vs histórico
                </span>
              ) : mediaUltimas4 < mediaGeral ? (
                <span className="text-red-600 font-medium">
                  {((mediaUltimas4 / mediaGeral - 1) * 100).toFixed(1)}% vs histórico
                </span>
              ) : (
                <span>Igual ao histórico</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Tendência 12 Semanas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Tendência (12 semanas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <Badge className={getTendenciaColor(tendencia12Semanas.tipo)}>
                {getTendenciaIcon(tendencia12Semanas.tipo)}
                <span className="ml-1">
                  {tendencia12Semanas.tipo === 'crescimento' ? 'Crescimento' :
                   tendencia12Semanas.tipo === 'queda' ? 'Queda' : 'Estável'}
                </span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.abs(tendencia12Semanas.percentual).toFixed(1)}% de variação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Indicadores - Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 4: Semana Atual (Projeção) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Semana Atual (Projeção)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Real:</span>
                <span className="text-2xl font-bold">{giroRealAtual}</span>
              </div>
              {giroAgendadoAtual > 0 && (
                <div className="flex justify-between items-baseline">
                  <span className="text-sm" style={{ color: 'hsl(var(--purple-600))' }}>
                    + Agendado:
                  </span>
                  <span className="text-xl font-semibold" style={{ color: 'hsl(var(--purple-600))' }}>
                    {giroAgendadoAtual}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between items-baseline">
                <span className="text-sm font-medium">Projetado:</span>
                <span className="text-3xl font-bold">{giroProjetado}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {performanceVsMedia > 0 ? (
                <span className="text-green-600 font-medium">
                  +{performanceVsMedia.toFixed(1)}% vs média
                </span>
              ) : performanceVsMedia < 0 ? (
                <span className="text-red-600 font-medium">
                  {performanceVsMedia.toFixed(1)}% vs média
                </span>
              ) : (
                <span>Igual à média</span>
              )}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{percentualSemanaPassado.toFixed(0)}% da semana</span>
                <span>{diasRestantes} dias restantes</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div 
                  className="bg-primary rounded-full h-1.5 transition-all"
                  style={{ width: `${percentualSemanaPassado}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Amplitude (Pico/Vale) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Amplitude (Últimas 12 sem)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pico:</span>
                <span className="text-xl font-bold text-green-600">
                  {picoSemanal}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vale:</span>
                <span className="text-xl font-bold text-red-600">
                  {valeSemanal}
                </span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-muted-foreground">Variação:</span>
                  <span className="text-lg font-semibold">
                    {amplitudeVariacao}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {mediaGeral > 0 ? `${((amplitudeVariacao / mediaGeral) * 100).toFixed(0)}% da média` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Giro Semanal - Últimas 12 Semanas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="semana" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              
              {/* Área para giro agendado (apenas última semana) */}
              <Area
                type="monotone"
                dataKey="Giro Agendado"
                fill="url(#colorAgendado)"
                stroke="none"
                stackId="1"
                connectNulls={false}
              />
              
              {/* Linha principal - Giro Real */}
              <Line
                type="monotone"
                dataKey="Giro Real"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (payload.isProjecao) {
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={5} 
                        fill="hsl(var(--primary))" 
                        strokeWidth={2} 
                        stroke="#fff" 
                        strokeDasharray="3 3" 
                      />
                    );
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--primary))" />;
                }}
                activeDot={{ r: 6 }}
              />
              
              {/* Linha pontilhada de projeção total */}
              <Line
                type="monotone"
                dataKey="Giro Total Projetado"
                stroke="hsl(var(--purple-600))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                connectNulls
              />
              
              {/* Linha de média histórica */}
              <Line
                type="monotone"
                dataKey="Média Histórica"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={false}
              />
              
              {/* Gradientes */}
              <defs>
                <linearGradient id="colorAgendado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--purple-500))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--purple-500))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Legenda explicativa */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm space-y-2">
            <p className="font-semibold">Legenda:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary"></div>
                <span><strong>Giro Real:</strong> Entregas já confirmadas no sistema</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--purple-500))', opacity: 0.3 }}></div>
                <span><strong>Giro Agendado:</strong> Entregas previstas mas ainda não confirmadas (apenas semana atual)</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: 'hsl(var(--purple-600))' }}></div>
                <span><strong>Total Projetado:</strong> Soma de real + agendado na semana atual</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
                <span><strong>Média Histórica:</strong> Média das 11 semanas anteriores (sem projeção)</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
