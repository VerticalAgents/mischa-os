import { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend
} from 'recharts';
import { Package, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';
import { ClientesPorCategoriaDropdown } from './components/ClientesPorCategoriaDropdown';

interface GiroPorCategoriaProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isLoading: boolean;
}

interface CategoriaStats {
  nome: string;
  totalClientes: number;
  giroTotal: number;
  giroMedio: number;
  faturamentoTotal: number;
  achievementMedio: number;
  distribuicaoPerformance: { verde: number; amarelo: number; vermelho: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// Truncar texto para labels
const truncateText = (text: string, maxLength: number = 12): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Cores do design system
const CHART_COLORS = [
  'hsl(217, 91%, 60%)',  // blue
  'hsl(160, 84%, 39%)',  // green
  'hsl(38, 92%, 50%)',   // amber
  'hsl(280, 65%, 60%)',  // purple
  'hsl(187, 85%, 43%)',  // cyan
  'hsl(0, 84%, 60%)',    // red
  'hsl(330, 80%, 60%)',  // pink
  'hsl(45, 93%, 47%)',   // yellow
];

// Tooltip customizado para PieChart
const PieChartTooltip = memo(({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
      <p className="font-semibold text-foreground mb-2">{data.name}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Clientes:</span>
          <span className="font-medium">{data.value}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">% do Total:</span>
          <span className="font-medium">{((data.percent || 0) * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Giro Médio:</span>
          <span className="font-medium">{data.giro?.toFixed(1) || '0'}</span>
        </div>
      </div>
    </div>
  );
});
PieChartTooltip.displayName = 'PieChartTooltip';

// Tooltip customizado para BarChart de Giro
const GiroBarTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Giro Médio:</span>
          <span className="font-medium text-blue-600">{payload[0]?.value?.toFixed(1) || '0'}</span>
        </div>
        {payload[0]?.payload?.faturamento && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Faturamento:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
                .format(payload[0].payload.faturamento)}
            </span>
          </div>
        )}
        {payload[0]?.payload?.totalClientes && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Clientes:</span>
            <span className="font-medium">{payload[0].payload.totalClientes}</span>
          </div>
        )}
      </div>
    </div>
  );
});
GiroBarTooltip.displayName = 'GiroBarTooltip';

// Tooltip customizado para BarChart de Achievement
const AchievementBarTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;
  
  const achievement = payload[0]?.value || 0;
  const achievementColor = achievement >= 90 ? 'text-green-600' : achievement >= 70 ? 'text-amber-600' : 'text-red-600';
  
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Achievement:</span>
          <span className={`font-medium ${achievementColor}`}>{achievement.toFixed(1)}%</span>
        </div>
        <div className="mt-2">
          <Badge 
            variant={achievement >= 90 ? 'default' : achievement >= 70 ? 'secondary' : 'destructive'}
            className="text-xs"
          >
            {achievement >= 90 ? 'Excelente' : achievement >= 70 ? 'Bom' : 'Atenção'}
          </Badge>
        </div>
      </div>
    </div>
  );
});
AchievementBarTooltip.displayName = 'AchievementBarTooltip';

// Label customizado para PieChart
const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Não mostrar label se < 5%
  
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  return (
    <text 
      x={x} 
      y={y} 
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function GiroPorCategoria({ dadosConsolidados, isLoading }: GiroPorCategoriaProps) {
  const [categoriaDropdownAberto, setCategoriaDropdownAberto] = useState<string | null>(null);

  // Processar dados com useMemo para evitar recálculos
  const { categoriasArray, dadosPieChart, dadosGiroBarChart, dadosAchievementBarChart, metricas } = useMemo(() => {
    if (!dadosConsolidados || dadosConsolidados.length === 0) {
      return {
        categoriasArray: [],
        dadosPieChart: [],
        dadosGiroBarChart: [],
        dadosAchievementBarChart: [],
        metricas: { totalCategorias: 0, giroMedioGlobal: 0, totalClientes: 0, faturamentoTotal: 0 }
      };
    }

    // Agrupar dados por categoria de estabelecimento
    const categoriaStats = dadosConsolidados.reduce((acc, item) => {
      const categoria = item.categoria_estabelecimento_nome || 'Não classificado';
      
      if (!acc[categoria]) {
        acc[categoria] = {
          nome: categoria,
          totalClientes: 0,
          giroTotal: 0,
          giroMedio: 0,
          faturamentoTotal: 0,
          achievementMedio: 0,
          distribuicaoPerformance: { verde: 0, amarelo: 0, vermelho: 0 }
        };
      }
      
      acc[categoria].totalClientes++;
      acc[categoria].giroTotal += item.giro_semanal_calculado || 0;
      acc[categoria].faturamentoTotal += item.faturamento_semanal_previsto || 0;
      acc[categoria].achievementMedio += item.achievement_meta || 0;
      
      const semaforo = item.semaforo_performance;
      if (semaforo === 'verde' || semaforo === 'amarelo' || semaforo === 'vermelho') {
        acc[categoria].distribuicaoPerformance[semaforo]++;
      }
      
      return acc;
    }, {} as Record<string, CategoriaStats>);

    // Calcular médias
    Object.values(categoriaStats).forEach((categoria) => {
      categoria.giroMedio = categoria.totalClientes > 0 
        ? categoria.giroTotal / categoria.totalClientes 
        : 0;
      categoria.achievementMedio = categoria.totalClientes > 0 
        ? categoria.achievementMedio / categoria.totalClientes 
        : 0;
    });

    // Ordenar por número de clientes (decrescente)
    const sortedCategorias = Object.values(categoriaStats).sort((a, b) => b.totalClientes - a.totalClientes);
    
    // Dados para gráfico de pizza (com percentual calculado)
    const totalClientes = sortedCategorias.reduce((sum, cat) => sum + cat.totalClientes, 0);
    const pieData = sortedCategorias.map((categoria) => ({
      name: categoria.nome,
      value: categoria.totalClientes,
      giro: categoria.giroMedio,
      percent: totalClientes > 0 ? categoria.totalClientes / totalClientes : 0
    }));

    // Dados para gráfico de barras de giro
    const giroBarData = sortedCategorias.map((categoria) => ({
      categoria: categoria.nome,
      categoriaShort: truncateText(categoria.nome, 10),
      giro_medio: categoria.giroMedio,
      faturamento: categoria.faturamentoTotal,
      totalClientes: categoria.totalClientes
    }));

    // Dados para gráfico de barras de achievement
    const achievementBarData = sortedCategorias.map((categoria) => ({
      categoria: categoria.nome,
      categoriaShort: truncateText(categoria.nome, 10),
      achievement: categoria.achievementMedio
    }));

    // Métricas globais
    const giroMedioGlobal = sortedCategorias.length > 0
      ? sortedCategorias.reduce((sum, cat) => sum + cat.giroMedio, 0) / sortedCategorias.length
      : 0;
    
    const faturamentoTotal = sortedCategorias.reduce((sum, cat) => sum + cat.faturamentoTotal, 0);

    return {
      categoriasArray: sortedCategorias,
      dadosPieChart: pieData,
      dadosGiroBarChart: giroBarData,
      dadosAchievementBarChart: achievementBarData,
      metricas: {
        totalCategorias: sortedCategorias.length,
        giroMedioGlobal,
        totalClientes: dadosConsolidados.length,
        faturamentoTotal
      }
    };
  }, [dadosConsolidados]);

  const toggleCategoriaDropdown = (categoria: string) => {
    setCategoriaDropdownAberto(
      categoriaDropdownAberto === categoria ? null : categoria
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado vazio
  if (!dadosConsolidados || dadosConsolidados.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Nenhum dado disponível</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Não há dados de giro consolidados para exibir análise por categoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Categorias</p>
                <p className="text-2xl font-bold">{metricas.totalCategorias}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Giro Médio Global</p>
                <p className="text-2xl font-bold">
                  {isNaN(metricas.giroMedioGlobal) ? '0' : metricas.giroMedioGlobal.toFixed(1)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{metricas.totalClientes}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { 
                    style: 'currency', 
                    currency: 'BRL',
                    notation: 'compact'
                  }).format(metricas.faturamentoTotal)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PieChart - Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Clientes por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPieChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={40}
                    label={renderCustomizedLabel}
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {dadosPieChart.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<PieChartTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-foreground">{truncateText(value, 15)}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* BarChart - Giro Médio por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Giro Médio por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={dadosGiroBarChart} 
                  margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="categoriaShort" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => value.toFixed(0)}
                  />
                  <Tooltip content={<GiroBarTooltip />} />
                  <Bar 
                    dataKey="giro_medio" 
                    fill="hsl(217, 91%, 60%)" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segundo gráfico de barras - Achievement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Achievement por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={dadosAchievementBarChart} 
                margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="categoriaShort" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 'dataMax']}
                />
                <Tooltip content={<AchievementBarTooltip />} />
                <Bar 
                  dataKey="achievement" 
                  isAnimationActive={false}
                  radius={[4, 4, 0, 0]}
                >
                  {dadosAchievementBarChart.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.achievement >= 90 
                          ? 'hsl(160, 84%, 39%)' 
                          : entry.achievement >= 70 
                            ? 'hsl(38, 92%, 50%)' 
                            : 'hsl(0, 84%, 60%)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela detalhada com dropdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Análise Detalhada por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categoriasArray.map((categoria) => (
              <div key={categoria.nome} className="border rounded-lg">
                <ClientesPorCategoriaDropdown
                  categoria={categoria.nome}
                  dadosConsolidados={dadosConsolidados}
                  isOpen={categoriaDropdownAberto === categoria.nome}
                  onToggle={() => toggleCategoriaDropdown(categoria.nome)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
