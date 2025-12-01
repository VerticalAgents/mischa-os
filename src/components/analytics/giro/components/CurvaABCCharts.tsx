
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DadosPie {
  categoria: string;
  nome: string;
  faturamento: number;
  percentual: number;
}

interface DadosBar {
  categoria: string;
  num_clientes: number;
  percentual_clientes: number;
  percentual_faturamento: number;
}

interface CurvaABCChartsProps {
  dadosPie: DadosPie[];
  dadosBar: DadosBar[];
  isLoading: boolean;
}

const COLORS = {
  A: '#22c55e', // green-500
  B: '#eab308', // yellow-500
  C: '#9ca3af'  // gray-400
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltipPie = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{data.nome}</p>
        <p className="text-muted-foreground">
          Faturamento: {formatCurrency(data.faturamento)}
        </p>
        <p className="text-muted-foreground">
          {data.percentual.toFixed(1)}% do total
        </p>
      </div>
    );
  }
  return null;
};

const CustomTooltipBar = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function CurvaABCCharts({ dadosPie, dadosBar, isLoading }: CurvaABCChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse bg-muted rounded-full w-48 h-48" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clientes vs Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse bg-muted rounded w-full h-48" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* PieChart - Distribuição de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dadosPie}
                dataKey="faturamento"
                nameKey="nome"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ categoria, percentual }) => `${categoria}: ${percentual.toFixed(0)}%`}
                labelLine={true}
              >
                {dadosPie.map((entry) => (
                  <Cell 
                    key={`cell-${entry.categoria}`} 
                    fill={COLORS[entry.categoria as keyof typeof COLORS]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltipPie />} />
              <Legend 
                formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* BarChart - Comparativo Clientes vs Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clientes vs Faturamento (%)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosBar} barGap={8}>
              <XAxis 
                dataKey="categoria" 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltipBar />} />
              <Legend 
                formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
              />
              <Bar 
                dataKey="percentual_clientes" 
                name="% Clientes" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="percentual_faturamento" 
                name="% Faturamento" 
                fill="#22c55e" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
