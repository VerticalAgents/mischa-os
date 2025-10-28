import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, subDays, startOfMonth, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Package } from "lucide-react";

export default function DashboardEntregasAnalytics() {
  const hoje = new Date();
  const [periodoSelecionado, setPeriodoSelecionado] = useState("30");
  const [mostrarUnidades, setMostrarUnidades] = useState(false);
  
  const { registros, carregarHistorico } = useHistoricoEntregasStore();

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  // Função para categorizar entregas (apenas entregas, não devoluções)
  const categorizarProduto = (nomeProduto: string): 'revenda' | 'foodservice' => {
    const nome = nomeProduto.toLowerCase();
    
    // Produtos Food-Service: Mini e Nano (porções individuais/serviço)
    if (nome.includes('mini') || nome.includes('nano')) {
      return 'foodservice';
    }
    
    // Produtos Revenda: Tamanho padrão/grande (para revenda)
    return 'revenda';
  };

  // Calcular dias do período
  const diasPeriodo = parseInt(periodoSelecionado);
  
  // Filtrar entregas do período (excluir devoluções)
  const entregasPeriodo = useMemo(() => {
    const dataInicio = startOfDay(subDays(hoje, diasPeriodo));
    const dataFim = endOfDay(hoje);
    
    return registros.filter(item => {
      const dataItem = new Date(item.data);
      return dataItem >= dataInicio && 
             dataItem <= dataFim && 
             item.tipo === 'entrega'; // Apenas entregas
    });
  }, [registros, diasPeriodo, hoje]);

  // Calcular totais
  const totais = useMemo(() => {
    let totalFormas = 0;
    let totalUnidades = 0;
    let totalRevenda = 0;
    let totalFoodService = 0;
    let totalUnidadesRevenda = 0;
    let totalUnidadesFoodService = 0;
    
    entregasPeriodo.forEach(entrega => {
      if (entrega.itens && Array.isArray(entrega.itens)) {
        entrega.itens.forEach((item: any) => {
          const categoria = categorizarProduto(item.nome_produto || '');
          const formas = item.quantidade || 0;
          const unidades = item.unidades_totais || 0;
          
          totalFormas += formas;
          totalUnidades += unidades;
          
          if (categoria === 'revenda') {
            totalRevenda += formas;
            totalUnidadesRevenda += unidades;
          } else {
            totalFoodService += formas;
            totalUnidadesFoodService += unidades;
          }
        });
      }
    });

    return {
      totalFormas,
      totalUnidades,
      totalRevenda,
      totalFoodService,
      totalUnidadesRevenda,
      totalUnidadesFoodService
    };
  }, [entregasPeriodo]);

  // Label do período
  const labelPeriodo = useMemo(() => {
    return `Últimos ${diasPeriodo} dias`;
  }, [diasPeriodo]);

  // Calcular quantos meses mostrar baseado no período selecionado
  const numeroMeses = useMemo(() => {
    const dias = parseInt(periodoSelecionado);
    if (dias <= 30) return 1;
    if (dias <= 60) return 2;
    if (dias <= 90) return 3;
    if (dias <= 180) return 6;
    return 12; // 365 dias = 1 ano
  }, [periodoSelecionado]);
  
  const dadosGraficoComparativo = useMemo(() => {
    // Gerar array com os meses baseado no período selecionado
    const meses: Date[] = [];
    for (let i = numeroMeses - 1; i >= 0; i--) {
      meses.push(startOfMonth(subMonths(hoje, i)));
    }

    const dados = meses.map(mes => {
      const inicioMes = startOfMonth(mes);
      const fimMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59, 59);

      const entregasMes = registros.filter(item => {
        const dataItem = new Date(item.data);
        return dataItem >= inicioMes && 
               dataItem <= fimMes && 
               item.tipo === 'entrega'; // Apenas entregas
      });

      let revenda = 0;
      let foodService = 0;
      let totalProdutosRevenda = 0;
      let totalProdutosFoodService = 0;

      entregasMes.forEach(entrega => {
        if (entrega.itens && Array.isArray(entrega.itens)) {
          entrega.itens.forEach((item: any) => {
            const categoria = categorizarProduto(item.nome_produto || '');
            const quantidade = mostrarUnidades ? (item.unidades_totais || 0) : (item.quantidade || 0);
            
            if (categoria === 'revenda') {
              revenda += quantidade;
              totalProdutosRevenda++;
            } else {
              foodService += quantidade;
              totalProdutosFoodService++;
            }
          });
        }
      });

      return {
        mes: format(mes, 'MMM/yy', { locale: ptBR }),
        revenda,
        foodService,
      };
    });

    // Debug: Log da categorização
    console.log('📊 Categorização de Entregas:', {
      periodoSelecionado: periodoSelecionado + ' dias',
      numeroMeses: numeroMeses,
      totalRegistrosRevenda: dados.reduce((acc, d) => acc + d.revenda, 0),
      totalRegistrosFoodService: dados.reduce((acc, d) => acc + d.foodService, 0),
      dadosGrafico: dados
    });

    return dados;
  }, [registros, hoje, mostrarUnidades, numeroMeses, periodoSelecionado]);

  // Cálculos de variação
  const variacao = useMemo(() => {
    if (dadosGraficoComparativo.length < 2) return { percentual: 0, tipo: 'neutro' as const };

    const mesAtual = dadosGraficoComparativo[dadosGraficoComparativo.length - 1];
    const mesAnterior = dadosGraficoComparativo[dadosGraficoComparativo.length - 2];

    const totalAtual = mesAtual.revenda + mesAtual.foodService;
    const totalAnterior = mesAnterior.revenda + mesAnterior.foodService;

    if (totalAnterior === 0) return { percentual: 0, tipo: 'neutro' as const };

    const percentual = ((totalAtual - totalAnterior) / totalAnterior) * 100;
    const tipo = percentual > 0 ? 'crescimento' : percentual < 0 ? 'queda' : 'neutro';

    return { percentual: Math.abs(percentual), tipo };
  }, [dadosGraficoComparativo]);

  const chartConfig = {
    revenda: {
      label: "Revenda",
      color: "hsl(262 83% 58%)",
    },
    foodService: {
      label: "Food-Service",
      color: "hsl(142 76% 36%)",
    },
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-3xl font-bold">Dashboard de Entregas</h2>
        <p className="text-muted-foreground">
          Análise de entregas por categoria e período
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant={mostrarUnidades ? "default" : "outline"}
          onClick={() => setMostrarUnidades(!mostrarUnidades)}
        >
          {mostrarUnidades ? "Exibindo Unidades" : "Exibindo Formas"}
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostrarUnidades ? totais.totalUnidades.toLocaleString('pt-BR') : totais.totalFormas.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {labelPeriodo}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenda</CardTitle>
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chartConfig.revenda.color }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostrarUnidades ? totais.totalUnidadesRevenda.toLocaleString('pt-BR') : totais.totalRevenda.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {totais.totalFormas > 0 
                ? `${((mostrarUnidades ? totais.totalUnidadesRevenda : totais.totalRevenda) / (mostrarUnidades ? totais.totalUnidades : totais.totalFormas) * 100).toFixed(1)}% do total`
                : '0% do total'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Food-Service</CardTitle>
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: chartConfig.foodService.color }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mostrarUnidades ? totais.totalUnidadesFoodService.toLocaleString('pt-BR') : totais.totalFoodService.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {totais.totalFormas > 0 
                ? `${((mostrarUnidades ? totais.totalUnidadesFoodService : totais.totalFoodService) / (mostrarUnidades ? totais.totalUnidades : totais.totalFormas) * 100).toFixed(1)}% do total`
                : '0% do total'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal por Categoria</CardTitle>
          <CardDescription>
            Comparativo de entregas entre Revenda e Food-Service
            {variacao.tipo !== 'neutro' && (
              <span className="ml-2">
                {variacao.tipo === 'crescimento' ? (
                  <span className="text-green-600 inline-flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {variacao.percentual.toFixed(1)}% vs mês anterior
                  </span>
                ) : (
                  <span className="text-red-600 inline-flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" />
                    {variacao.percentual.toFixed(1)}% vs mês anterior
                  </span>
                )}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dadosGraficoComparativo.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Nenhum dado disponível para o período
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoComparativo} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="mes" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => value.toLocaleString('pt-BR')}
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenda" 
                    fill="var(--color-revenda)" 
                    name="Revenda"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="foodService" 
                    fill="var(--color-foodService)" 
                    name="Food-Service"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
