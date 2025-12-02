import { useMemo, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Activity, Minus, BarChart3, Target, Users } from "lucide-react";
import { useGiroDashboardGeral } from "@/hooks/useGiroDashboardGeral";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useGiroMedioPorPDV } from "@/hooks/useGiroMedioPorPDV";
import TooltipExplicativo from "@/components/common/TooltipExplicativo";
import { GIRO_TOOLTIPS } from "@/data/indicadoresTooltips";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  'Ativo': '#22c55e',
  'Inativo': '#ef4444',
  'Em análise': '#f59e0b',
  'Standby': '#6b7280',
  'A ativar': '#3b82f6',
  'Pipeline': '#8b5cf6'
};

// Componente de Tooltip memoizado
const CustomTooltip = memo(({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isProjecao = data.isProjecao;
    const giroTotal = data['Giro Real'];
    const mediaHistorica = data['Média Histórica'];
    const diffVsMedia = mediaHistorica > 0 
      ? ((giroTotal / mediaHistorica - 1) * 100).toFixed(1)
      : '0';
    
    return (
      <div className="bg-card border-2 rounded-lg p-3 shadow-lg min-w-[200px]">
        <p className="font-semibold mb-1">
          {data.periodoInicio}
        </p>
        {isProjecao && (
          <Badge variant="secondary" className="text-xs mb-2">
            Projeção
          </Badge>
        )}
        
        <div className="space-y-1.5 text-sm mt-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Giro Total:</span>
            <span className="font-bold">{giroTotal}</span>
          </div>
          
          <div className="border-t pt-1.5 mt-1.5 flex justify-between gap-4">
            <span className="text-muted-foreground">Média Histórica:</span>
            <span className="font-semibold">{mediaHistorica}</span>
          </div>
          
          <div className="text-xs pt-1 text-muted-foreground">
            {parseFloat(diffVsMedia) >= 0 ? '+' : ''}{diffVsMedia}% vs média
          </div>
        </div>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

// Componente de Loading isolado
const LoadingState = memo(() => (
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
));

LoadingState.displayName = 'LoadingState';

interface ClienteData {
  totalClientes: number;
  clientesAtivos: number;
  totalPDVs: number;
  pdvsDiretos: number;
  pdvsViaDistribuidores: number;
  giroMedio: number;
  giroMedio4Semanas: number;
  giroMedio12Semanas: number;
  variacaoGiroMedio: number;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
}

// Componente principal memoizado
const GiroDashboardGeralContent = memo(({ 
  dados, 
  clienteData, 
  giro4Semanas, 
  variacaoGiroTotal 
}: { 
  dados: any; 
  clienteData: ClienteData;
  giro4Semanas: number;
  variacaoGiroTotal: number;
}) => {
  const {
    historicoSemanas,
    totalUltimos30Dias,
    mediaUltimas4Consolidadas,
    mediaGeral,
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

  // Memoizar dados do gráfico
  const chartData = useMemo(() => 
    historicoSemanas.map((sem: any) => ({
      semana: sem.semana,
      periodoInicio: sem.periodoInicio,
      periodoFim: sem.periodoFim,
      'Giro Real': sem.giroReal + (sem.giroAgendado || 0),
      'Média Histórica': Math.round(mediaGeral),
      isProjecao: sem.isProjecao || false
    })), [historicoSemanas, mediaGeral]
  );

  const getTendenciaIcon = useCallback((tipo: string) => {
    if (tipo === 'crescimento') return <TrendingUp className="h-4 w-4" />;
    if (tipo === 'queda') return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  }, []);

  const getTendenciaColor = useCallback((tipo: string) => {
    if (tipo === 'crescimento') return 'bg-green-600 text-white';
    if (tipo === 'queda') return 'bg-red-600 text-white';
    return 'bg-muted text-muted-foreground';
  }, []);

  return (
    <div className="space-y-6">
      {/* Cards de Indicadores - Linha 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Últimos 30 Dias */}
        <TooltipExplicativo explicacao={GIRO_TOOLTIPS.totalUltimos30Dias} variant="indicator">
          <Card className="cursor-help hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                Total Últimos 30 Dias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(totalUltimos30Dias)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Entregas confirmadas (30 dias)
              </p>
            </CardContent>
          </Card>
        </TooltipExplicativo>

        {/* Card 2: Giro Médio Semanal */}
        <TooltipExplicativo explicacao={GIRO_TOOLTIPS.giroMedioSemanal} variant="indicator">
          <Card className="cursor-help hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                Giro Médio Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(giro4Semanas)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {variacaoGiroTotal > 0 ? (
                  <span className="text-green-600 font-medium">
                    +{variacaoGiroTotal.toFixed(1)}% vs histórico
                  </span>
                ) : variacaoGiroTotal < 0 ? (
                  <span className="text-red-600 font-medium">
                    {variacaoGiroTotal.toFixed(1)}% vs histórico
                  </span>
                ) : (
                  <span>Igual ao histórico</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Últimas 4 semanas consolidadas
              </p>
            </CardContent>
          </Card>
        </TooltipExplicativo>

        {/* Card 3: Tendência 12 Semanas */}
        <TooltipExplicativo explicacao={GIRO_TOOLTIPS.tendencia12Semanas} variant="indicator">
          <Card className="cursor-help hover:shadow-md transition-all duration-200">
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
        </TooltipExplicativo>
      </div>

      {/* Seção: Cards Clientes + Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna esquerda: Cards empilhados */}
        <div className="space-y-4">
          {/* Card: Total de PDVs */}
          <TooltipExplicativo explicacao={GIRO_TOOLTIPS.clientesAtivos} variant="indicator">
            <Card className="cursor-help hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de PDVs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clienteData.totalPDVs}</div>
                <p className="text-xs text-muted-foreground">
                  {clienteData.pdvsViaDistribuidores > 0 
                    ? `${clienteData.pdvsDiretos} diretos + ${clienteData.pdvsViaDistribuidores} via distribuidores`
                    : `${clienteData.pdvsDiretos} diretos`
                  }
                </p>
              </CardContent>
            </Card>
          </TooltipExplicativo>

          {/* Card: Giro Médio */}
          <TooltipExplicativo explicacao={GIRO_TOOLTIPS.giroMedioPorPDV} variant="indicator">
            <Card className="cursor-help hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Giro Médio por PDV</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clienteData.giroMedio4Semanas}</div>
                <div className="flex items-center gap-1 mt-1 mb-1">
                  {clienteData.variacaoGiroMedio > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs font-semibold text-green-600">
                        +{clienteData.variacaoGiroMedio.toFixed(1)}%
                      </span>
                    </>
                  ) : clienteData.variacaoGiroMedio < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-xs font-semibold text-red-600">
                        {clienteData.variacaoGiroMedio.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Estável
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">
                    vs histórico
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Média das últimas 4 semanas
                </p>
              </CardContent>
            </Card>
          </TooltipExplicativo>
        </div>

        {/* Coluna direita: Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clienteData.statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    animationDuration={0}
                  >
                    {clienteData.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [`${value} clientes`, name]}
                  />
                  <Legend
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Indicadores - Linha 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 4: Semana Atual (Projeção) */}
        <TooltipExplicativo explicacao={GIRO_TOOLTIPS.semanaAtualProjecao} variant="indicator">
          <Card className="cursor-help hover:shadow-md transition-all duration-200">
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
                    <span className="text-sm text-primary">
                      + Agendado:
                    </span>
                    <span className="text-xl font-semibold text-primary">
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
        </TooltipExplicativo>

        {/* Card 5: Amplitude (Pico/Vale) */}
        <TooltipExplicativo explicacao={GIRO_TOOLTIPS.amplitude} variant="indicator">
          <Card className="cursor-help hover:shadow-md transition-all duration-200">
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
        </TooltipExplicativo>
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
            <ComposedChart 
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="semana" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              
              {/* Linha de média histórica */}
              <Line
                type="monotone"
                dataKey="Média Histórica"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Média Histórica"
                isAnimationActive={false}
              />
              
              {/* Linha principal */}
              <Line
                type="monotone"
                dataKey="Giro Real"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                name="Giro Semanal"
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Legenda explicativa */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg text-sm space-y-2">
            <p className="font-semibold">Legenda:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary"></div>
                <span><strong>Giro Semanal:</strong> Entregas confirmadas + agendamentos programados</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground"></div>
                <span><strong>Média Histórica:</strong> Média das 11 semanas anteriores</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

GiroDashboardGeralContent.displayName = 'GiroDashboardGeralContent';

interface GiroDashboardGeralProps {
  filtros?: {
    representante?: string;
    rota?: string;
    categoria_estabelecimento?: string;
  };
}

export function GiroDashboardGeral({ filtros }: GiroDashboardGeralProps = {}) {
  const { dados, loading, error } = useGiroDashboardGeral();
  const { clientes, loading: clientesLoading } = useClienteStore();
  const { 
    giroMedioPorPDV, 
    giroMedio4Semanas,
    giroMedio12Semanas,
    variacaoGiroMedio,
    giro4Semanas,
    variacaoGiroTotal,
    totalPDVs,
    pdvsDiretos,
    pdvsViaDistribuidores,
    isLoading: giroLoading 
  } = useGiroMedioPorPDV();

  // Calcular dados de clientes
  const clienteData = useMemo(() => {
    const ativos = clientes.filter(c => c.statusCliente === 'Ativo').length;
    const total = clientes.length;

    // Calcular distribuição por status
    const statusCount: Record<string, number> = {};
    clientes.forEach(cliente => {
      const status = cliente.statusCliente || 'Sem status';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const statusDistribution = Object.entries(statusCount)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#9ca3af'
      }))
      .sort((a, b) => b.value - a.value);

    return {
      totalClientes: total,
      clientesAtivos: ativos,
      totalPDVs,
      pdvsDiretos,
      pdvsViaDistribuidores,
      giroMedio: giroMedioPorPDV,
      giroMedio4Semanas,
      giroMedio12Semanas,
      variacaoGiroMedio,
      statusDistribution
    };
  }, [clientes, giroMedioPorPDV, giroMedio4Semanas, giroMedio12Semanas, variacaoGiroMedio, totalPDVs, pdvsDiretos, pdvsViaDistribuidores]);

  if (loading || clientesLoading || giroLoading) {
    return <LoadingState />;
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

  return <GiroDashboardGeralContent dados={dados} clienteData={clienteData} giro4Semanas={giro4Semanas} variacaoGiroTotal={variacaoGiroTotal} />;
}
