
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, TrendingUp, Target, DollarSign, Route, Users, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DadosAnaliseGiroConsolidados, GiroOverview, GiroRegionalData } from '@/types/giroAnalysis';
import { ClientesPorRotaDropdown } from './components/ClientesPorRotaDropdown';

interface GiroOverviewGeneralProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  overview: GiroOverview | null;
  regional: GiroRegionalData[] | null;
  isLoading: boolean;
}

interface RotaMetrica {
  rota_entrega: string;
  total_clientes: number;
  volumeTotal: number;
  giroMedioPorCliente: number;
  faturamentoTotal: number;
  achievementMedio: number;
}

// Tooltip customizado para o gráfico
const RotaBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  const data = payload[0].payload;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[200px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Volume Total:</span>
          <span className="font-medium">{data.volumeTotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Clientes:</span>
          <span className="font-medium">{data.total_clientes}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Eficiência:</span>
          <span className={`font-medium ${data.achievementMedio >= 90 ? 'text-green-600' : data.achievementMedio >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
            {data.achievementMedio.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export function GiroOverviewGeneral({ 
  dadosConsolidados, 
  overview, 
  regional, 
  isLoading 
}: GiroOverviewGeneralProps) {
  const [rotaAbertaId, setRotaAbertaId] = useState<string | null>(null);

  const toggleRota = (rota: string) => {
    setRotaAbertaId(rotaAbertaId === rota ? null : rota);
  };

  // Calcular métricas detalhadas por rota
  const rotasMetricas = useMemo((): RotaMetrica[] => {
    if (!regional || !dadosConsolidados) return [];
    
    return regional.map(rota => {
      const clientesDaRota = dadosConsolidados.filter(c => c.rota_entrega_nome === rota.rota_entrega);
      const volumeTotal = clientesDaRota.reduce((sum, c) => sum + (c.giro_semanal_calculado || 0), 0);
      const faturamentoTotal = clientesDaRota.reduce((sum, c) => sum + (c.faturamento_semanal_previsto || 0), 0);
      const achievementTotal = clientesDaRota.reduce((sum, c) => sum + (c.achievement_meta || 0), 0);
      
      return {
        rota_entrega: rota.rota_entrega,
        total_clientes: clientesDaRota.length,
        volumeTotal,
        giroMedioPorCliente: clientesDaRota.length > 0 ? volumeTotal / clientesDaRota.length : 0,
        faturamentoTotal,
        achievementMedio: clientesDaRota.length > 0 ? achievementTotal / clientesDaRota.length : 0
      };
    }).sort((a, b) => b.volumeTotal - a.volumeTotal);
  }, [regional, dadosConsolidados]);

  // Métricas consolidadas
  const metricasConsolidadas = useMemo(() => {
    const totalRotas = rotasMetricas.length;
    const volumeTotal = rotasMetricas.reduce((sum, r) => sum + r.volumeTotal, 0);
    const mediaPorRota = totalRotas > 0 ? volumeTotal / totalRotas : 0;
    const eficienciaGeral = totalRotas > 0 
      ? rotasMetricas.reduce((sum, r) => sum + r.achievementMedio, 0) / totalRotas 
      : 0;
    
    return { totalRotas, volumeTotal, mediaPorRota, eficienciaGeral };
  }, [rotasMetricas]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas de Rotas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Route className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Total de Rotas</p>
                <p className="text-2xl font-bold text-left">
                  {metricasConsolidadas.totalRotas}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Volume Total</p>
                <p className="text-2xl font-bold text-left">
                  {metricasConsolidadas.volumeTotal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Média por Rota</p>
                <p className="text-2xl font-bold text-left">
                  {metricasConsolidadas.mediaPorRota.toFixed(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground text-left">Eficiência Geral</p>
                <p className="text-2xl font-bold text-left">
                  {metricasConsolidadas.eficienciaGeral.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo de Volume por Rota */}
      {rotasMetricas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-left">Comparativo de Volume por Rota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={rotasMetricas.slice(0, 10)}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis 
                    dataKey="rota_entrega" 
                    type="category" 
                    width={100} 
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<RotaBarTooltip />} />
                  <Bar dataKey="volumeTotal" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                    {rotasMetricas.slice(0, 10).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.achievementMedio >= 90 
                            ? 'hsl(160, 84%, 39%)' 
                            : entry.achievementMedio >= 70 
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
      )}

      {/* Tabela Detalhada de Rotas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Análise Detalhada por Rota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rota</TableHead>
                  <TableHead className="text-center">Clientes</TableHead>
                  <TableHead className="text-center">Volume Total</TableHead>
                  <TableHead className="text-center">Giro Médio</TableHead>
                  <TableHead className="text-center">Faturamento</TableHead>
                  <TableHead className="text-center">Eficiência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rotasMetricas.map((rota, index) => (
                  <TableRow key={rota.rota_entrega}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {index + 1}º
                        </Badge>
                        {rota.rota_entrega}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{rota.total_clientes}</TableCell>
                    <TableCell className="text-center font-medium">{rota.volumeTotal}</TableCell>
                    <TableCell className="text-center">{rota.giroMedioPorCliente.toFixed(1)}</TableCell>
                    <TableCell className="text-center">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL',
                        notation: 'compact'
                      }).format(rota.faturamentoTotal)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={rota.achievementMedio >= 90 ? 'default' : rota.achievementMedio >= 70 ? 'secondary' : 'destructive'}
                      >
                        {rota.achievementMedio.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Clientes por Rota (dropdown expandível) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Clientes por Rota</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {regional?.map((rota) => (
              <ClientesPorRotaDropdown
                key={rota.rota_entrega}
                rota={rota.rota_entrega}
                dadosConsolidados={dadosConsolidados}
                isOpen={rotaAbertaId === rota.rota_entrega}
                onToggle={() => toggleRota(rota.rota_entrega)}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
