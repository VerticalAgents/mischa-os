
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface GiroPorCategoriaProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isLoading: boolean;
}

export function GiroPorCategoria({ dadosConsolidados, isLoading }: GiroPorCategoriaProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
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
    acc[categoria].giroTotal += item.giro_semanal_calculado;
    acc[categoria].faturamentoTotal += item.faturamento_semanal_previsto;
    acc[categoria].achievementMedio += item.achievement_meta;
    acc[categoria].distribuicaoPerformance[item.semaforo_performance as keyof typeof acc[categoria].distribuicaoPerformance]++;
    
    return acc;
  }, {} as Record<string, any>);

  // Calcular médias
  Object.values(categoriaStats).forEach((categoria: any) => {
    categoria.giroMedio = categoria.giroTotal / categoria.totalClientes;
    categoria.achievementMedio = categoria.achievementMedio / categoria.totalClientes;
  });

  const categoriasArray = Object.values(categoriaStats);
  
  // Dados para gráfico de pizza
  const dadosPieChart = categoriasArray.map((categoria: any) => ({
    name: categoria.nome,
    value: categoria.totalClientes,
    giro: categoria.giroMedio
  }));

  // Dados para gráfico de barras
  const dadosBarChart = categoriasArray.map((categoria: any) => ({
    categoria: categoria.nome,
    giro_medio: categoria.giroMedio,
    achievement: categoria.achievementMedio,
    faturamento: categoria.faturamentoTotal
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Categorias</p>
                <p className="text-2xl font-bold">{categoriasArray.length}</p>
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
                  {(categoriasArray.reduce((sum: number, cat: any) => sum + cat.giroMedio, 0) / categoriasArray.length).toFixed(1)}
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
                <p className="text-2xl font-bold">{dadosConsolidados.length}</p>
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
                  }).format(categoriasArray.reduce((sum: number, cat: any) => sum + cat.faturamentoTotal, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
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
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosPieChart.map((entry, index) => (
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
            <CardTitle>Giro Médio por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categoria" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="giro_medio" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Clientes</TableHead>
                <TableHead className="text-right">Giro Médio</TableHead>
                <TableHead className="text-right">Achievement</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead className="text-center">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriasArray.map((categoria: any) => (
                <TableRow key={categoria.nome}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell className="text-right">{categoria.totalClientes}</TableCell>
                  <TableCell className="text-right font-mono">
                    {categoria.giroMedio.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{categoria.achievementMedio.toFixed(1)}%</span>
                      <Progress value={categoria.achievementMedio} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {new Intl.NumberFormat('pt-BR', { 
                      style: 'currency', 
                      currency: 'BRL' 
                    }).format(categoria.faturamentoTotal)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex gap-1 justify-center">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        {categoria.distribuicaoPerformance.verde}
                      </Badge>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        {categoria.distribuicaoPerformance.amarelo}
                      </Badge>
                      <Badge variant="secondary" className="bg-red-100 text-red-800 text-xs">
                        {categoria.distribuicaoPerformance.vermelho}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
