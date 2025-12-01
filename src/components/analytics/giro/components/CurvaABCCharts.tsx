import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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

const COLORS: Record<string, string> = {
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

export function CurvaABCCharts({ dadosPie, dadosBar, isLoading }: CurvaABCChartsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Clientes vs Faturamento</CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-72 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filtrar dados com valores > 0 para o pie chart
  const dadosPieValidos = dadosPie.filter(d => d.faturamento > 0);
  const temDadosPie = dadosPieValidos.length > 0;
  const temDadosBar = dadosBar && dadosBar.length > 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* PieChart - Distribuição de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Faturamento</CardTitle>
        </CardHeader>
        <CardContent>
          {temDadosPie ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPieValidos}
                    dataKey="faturamento"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    animationDuration={0}
                  >
                    {dadosPieValidos.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[entry.categoria] || '#9ca3af'} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-muted-foreground">Sem dados de faturamento</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BarChart - Comparativo Clientes vs Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Clientes vs Faturamento (%)</CardTitle>
        </CardHeader>
        <CardContent>
          {temDadosBar ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={dadosBar} 
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="categoria" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="percentual_clientes" 
                    name="% Clientes" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={0}
                  />
                  <Bar 
                    dataKey="percentual_faturamento" 
                    name="% Faturamento" 
                    fill="#22c55e" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={0}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-muted-foreground">Sem dados para exibir</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
