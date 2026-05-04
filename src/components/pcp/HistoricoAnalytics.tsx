import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductionAnalytics } from "@/hooks/useProductionAnalytics";
import { TrendingUp, TrendingDown, Package, Calendar, Factory, Filter, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subYears, subDays, isWithinInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useSupabaseHistoricoProducao } from "@/hooks/useSupabaseHistoricoProducao";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
export default function HistoricoAnalytics() {
  // Estados para controle de UI
  const [filtrarPorProporcao, setFiltrarPorProporcao] = useState(false);
  const [isRevendaDetailsOpen, setIsRevendaDetailsOpen] = useState(false);
  const [isFoodServiceDetailsOpen, setIsFoodServiceDetailsOpen] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("90");
  const [mesesGrafico, setMesesGrafico] = useState("12");
  const [foodServiceMetrica, setFoodServiceMetrica] = useState<"unidades" | "peso">("unidades");
  
  // Dados do Supabase
  const { proporcoes, loading: loadingProporcoes } = useSupabaseProporoesPadrao();
  const { categorias } = useSupabaseCategoriasProduto();
  const { historico } = useSupabaseHistoricoProducao();
  const { produtos } = useSupabaseProdutos();

  // Mapa nome -> peso_unitario (g) para cálculo de peso do food-service
  const pesoUnitarioMap = useMemo(() => {
    const m = new Map<string, number>();
    (produtos || []).forEach((p: any) => {
      if (p?.nome) m.set(p.nome, Number(p.peso_unitario) || 0);
    });
    return m;
  }, [produtos]);
  
  // Função para categorizar produtos baseado no nome
  const categorizarProduto = (nomeProduto: string): 'revenda' | 'foodservice' => {
    const nome = nomeProduto.toLowerCase();
    
    // Produtos Food-Service: Mini e Nano (porções menores para serviço)
    if (nome.includes('mini') || nome.includes('nano')) {
      return 'foodservice';
    }
    
    // Produtos Revenda: Tamanho padrão (para revenda)
    return 'revenda';
  };
  
  // Datas de referência
  const hoje = new Date();
  const inicioMesAtual = startOfMonth(hoje);
  const fimMesAtual = endOfMonth(hoje);
  const inicioTresMeses = startOfMonth(subMonths(hoje, 2));

  // Mês atual
  const {
    kpis: kpisMesAtual
  } = useProductionAnalytics({
    startDate: inicioMesAtual,
    endDate: fimMesAtual,
    aggregation: 'day'
  });

  // Últimos 3 meses
  const {
    kpis: kpisTresMeses
  } = useProductionAnalytics({
    startDate: inicioTresMeses,
    endDate: fimMesAtual,
    aggregation: 'month'
  });

  // Mesmo mês ano passado
  const mesmoMesAnoPassado = subYears(hoje, 1);
  const inicioMesmoMesAnoPassado = startOfMonth(mesmoMesAnoPassado);
  const fimMesmoMesAnoPassado = endOfMonth(mesmoMesAnoPassado);
  const {
    kpis: kpisMesmoMesAnoPassado
  } = useProductionAnalytics({
    startDate: inicioMesmoMesAnoPassado,
    endDate: fimMesmoMesAnoPassado,
    aggregation: 'day'
  });

  // Mês anterior para calcular variação
  const mesAnterior = subMonths(hoje, 1);
  const inicioMesAnterior = startOfMonth(mesAnterior);
  const fimMesAnterior = endOfMonth(mesAnterior);
  const {
    kpis: kpisMesAnterior
  } = useProductionAnalytics({
    startDate: inicioMesAnterior,
    endDate: fimMesAnterior,
    aggregation: 'day'
  });

  // Período dinâmico baseado na seleção
  const diasPeriodo = parseInt(periodoSelecionado);
  const inicioPeriodo = subDays(hoje, diasPeriodo);
  const categoriaRevenda = categorias.find(c => c.nome.toLowerCase().includes('revenda'));
  const categoriaFoodService = categorias.find(c => c.nome.toLowerCase().includes('food'));
  
  // Revenda - Período selecionado
  const {
    kpis: kpisRevenda90Dias,
    topProducts: produtosRevenda90Dias
  } = useProductionAnalytics({
    startDate: inicioPeriodo,
    endDate: hoje,
    aggregation: 'day',
    categoriaId: categoriaRevenda?.id
  });

  // Food Service - Período selecionado
  const {
    kpis: kpisFoodService90Dias,
    topProducts: produtosFoodService90Dias
  } = useProductionAnalytics({
    startDate: inicioPeriodo,
    endDate: hoje,
    aggregation: 'day',
    categoriaId: categoriaFoodService?.id
  });

  // Texto do período para exibição
  const textoPeriodo = useMemo(() => {
    if (diasPeriodo >= 365) return "Último ano";
    return `Últimos ${diasPeriodo} dias`;
  }, [diasPeriodo]);

  // Quantidade de meses exibidos no gráfico de evolução (independente do filtro de período acima)
  const numeroMeses = useMemo(() => {
    const n = parseInt(mesesGrafico);
    return Number.isFinite(n) && n > 0 ? n : 12;
  }, [mesesGrafico]);
  
  const dadosGraficoComparativo = useMemo(() => {
    // Gerar array com os meses baseado no período selecionado
    const meses: Date[] = [];
    for (let i = numeroMeses - 1; i >= 0; i--) {
      meses.push(startOfMonth(subMonths(hoje, i)));
    }

    // Contadores para debug
    let totalProdutosRevenda = 0;
    let totalProdutosFoodService = 0;

    const dados = meses.map(mesInicio => {
      const mesFim = endOfMonth(mesInicio);
      const mesLabel = format(mesInicio, "MMM/yy", { locale: ptBR });

      // Filtrar registros deste mês
      const registrosMes = historico.filter(record => {
        const dataProducao = startOfDay(new Date(record.data_producao));
        return isWithinInterval(dataProducao, { start: mesInicio, end: mesFim });
      });

      // Separar por categoria e somar formas e unidades
      let formasRevenda = 0;
      let formasFoodService = 0;
      let unidadesRevenda = 0;
      let unidadesFoodService = 0;
      let pesoFoodServiceKg = 0;

      registrosMes.forEach(record => {
        const categoria = categorizarProduto(record.produto_nome);
        const unidades = record.unidades_calculadas || 0;
        const pesoUnitG = pesoUnitarioMap.get(record.produto_nome) || 0;
        const pesoKg = (unidades * pesoUnitG) / 1000;
        if (categoria === 'revenda') {
          formasRevenda += record.formas_producidas;
          unidadesRevenda += unidades;
          totalProdutosRevenda++;
        } else {
          formasFoodService += record.formas_producidas;
          unidadesFoodService += unidades;
          pesoFoodServiceKg += pesoKg;
          totalProdutosFoodService++;
        }
      });

      return {
        mes: mesLabel,
        revenda: unidadesRevenda,
        foodService: unidadesFoodService,
        foodServicePeso: Number(pesoFoodServiceKg.toFixed(2))
      };
    });

    // Debug: Log da categorização
    console.log('📊 Categorização de Produtos:', {
      periodoSelecionado: periodoSelecionado + ' dias',
      numeroMeses: numeroMeses,
      totalRegistrosRevenda: totalProdutosRevenda,
      totalRegistrosFoodService: totalProdutosFoodService,
      dadosGrafico: dados
    });

    return dados;
  }, [historico, hoje, numeroMeses, periodoSelecionado, pesoUnitarioMap]);


  // Cálculos de variação
  const variacaoMesAnterior = kpisMesAnterior.totalUnitsProduced > 0 ? (kpisMesAtual.totalUnitsProduced - kpisMesAnterior.totalUnitsProduced) / kpisMesAnterior.totalUnitsProduced * 100 : 0;
  const variacaoAnoAnterior = kpisMesmoMesAnoPassado.totalUnitsProduced > 0 ? (kpisMesAtual.totalUnitsProduced - kpisMesmoMesAnoPassado.totalUnitsProduced) / kpisMesmoMesAnoPassado.totalUnitsProduced * 100 : 0;

  // Criar mapa de proporções para lookup rápido
  const proporcoesMap = useMemo(() => {
    return new Map(proporcoes.map(p => [p.produto_nome, p.percentual]));
  }, [proporcoes]);

  // Filtrar produtos Revenda baseado no toggle e recalcular percentuais
  const produtosRevendaFiltrados = useMemo(() => {
    if (filtrarPorProporcao) {
      // Filtrar produtos com proporção > 0
      const filtrados = produtosRevenda90Dias.filter(produto => {
        const proporcao = proporcoesMap.get(produto.productName) || 0;
        return proporcao > 0;
      });

      // Recalcular percentuais para somar 100%
      const totalFormasFiltradas = filtrados.reduce((sum, p) => sum + p.totalForms, 0);
      
      if (totalFormasFiltradas === 0) return filtrados;

      return filtrados.map(produto => ({
        ...produto,
        percentage: (produto.totalForms / totalFormasFiltradas) * 100
      }));
    }
    return produtosRevenda90Dias;
  }, [produtosRevenda90Dias, filtrarPorProporcao, proporcoesMap]);
  return <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Produção Mês Atual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produção Mês Atual
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisMesAtual.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {variacaoMesAnterior >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className={variacaoMesAnterior >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(variacaoMesAnterior).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Comparação Ano Anterior */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              vs {format(mesmoMesAnoPassado, "MMMM yyyy", {
              locale: ptBR
            })}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpisMesmoMesAnoPassado.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {variacaoAnoAnterior >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className={variacaoAnoAnterior >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(variacaoAnoAnterior).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">de diferença</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription className="text-left">
            Selecione o período para análise por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="periodo-select" className="text-sm font-medium whitespace-nowrap">
              Período de análise:
            </Label>
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger id="periodo-select" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos Últimos Dias - Por Categoria */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produção Revenda
                </CardTitle>
                <CardDescription className="text-left">
                  {textoPeriodo}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="filtro-proporcao-revenda" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Apenas com proporção
                </Label>
                <Switch 
                  id="filtro-proporcao-revenda"
                  checked={filtrarPorProporcao}
                  onCheckedChange={setFiltrarPorProporcao}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Geral */}
              <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Total Produzido</p>
                <p className="text-3xl font-bold text-primary">
                  {kpisRevenda90Dias.totalUnitsProduced.toLocaleString('pt-BR')} un
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {kpisRevenda90Dias.totalFormsProduced.toLocaleString('pt-BR')} formas
                </p>
              </div>

              {/* Produtos Individuais - Collapsible */}
              {produtosRevendaFiltrados.length > 0 && (
                <Collapsible open={isRevendaDetailsOpen} onOpenChange={setIsRevendaDetailsOpen}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isRevendaDetailsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-3">
                    {produtosRevendaFiltrados.map((produto) => (
                      <div key={produto.productName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{produto.productName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm px-2 py-0.5">
                              {produto.totalForms.toLocaleString('pt-BR')} formas
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              {produto.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${produto.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
              {produtosRevendaFiltrados.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {filtrarPorProporcao 
                    ? 'Nenhum produto com proporção padrão configurada'
                    : 'Nenhum produto encontrado no período'
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produção Food-Service
            </CardTitle>
            <CardDescription className="text-left">
              {textoPeriodo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Geral */}
              <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Total Produzido</p>
                <p className="text-3xl font-bold text-primary">
                  {kpisFoodService90Dias.totalUnitsProduced.toLocaleString('pt-BR')} un
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {kpisFoodService90Dias.totalFormsProduced.toLocaleString('pt-BR')} formas
                </p>
              </div>

              {/* Produtos Individuais - Collapsible */}
              {produtosFoodService90Dias.length > 0 && (
                <Collapsible open={isFoodServiceDetailsOpen} onOpenChange={setIsFoodServiceDetailsOpen}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isFoodServiceDetailsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-3">
                    {produtosFoodService90Dias.map((produto) => (
                      <div key={produto.productName} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{produto.productName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm px-2 py-0.5">
                              {produto.totalForms.toLocaleString('pt-BR')} formas
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              {produto.percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${produto.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Gráfico Comparativo - Evolução da Produção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução da Produção por Categoria
              </CardTitle>
              <CardDescription className="text-left">
                Comparativo mensal de unidades produzidas - Últimos {numeroMeses} {numeroMeses === 1 ? 'mês' : 'meses'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <Select value={mesesGrafico} onValueChange={setMesesGrafico}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Últimos 12 meses</SelectItem>
                  <SelectItem value="24">Últimos 24 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dadosGraficoComparativo.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>Nenhum dado disponível para o período</p>
            </div>
          ) : (
            <ChartContainer
            config={{
              revenda: {
                label: "Revenda",
                color: "hsl(262 83% 58%)",
              },
              foodService: {
                label: "Food-Service",
                color: "hsl(142 76% 36%)",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficoComparativo} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="mes" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  label={{ 
                    value: 'Unidades Produzidas', 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { fill: 'hsl(var(--foreground))' }
                  }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value) => value.toLocaleString('pt-BR')}
                  />} 
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

      {/* Card com detalhes adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Produção</CardTitle>
          <CardDescription className="text-left">
            Análise comparativa dos últimos períodos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-left">Taxa de Confirmação (Últimos 3 meses)</p>
                <p className="text-2xl font-bold text-left">{kpisTresMeses.confirmationRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground text-left">Rendimento Médio (Últimos 3 meses)</p>
                <p className="text-2xl font-bold text-left">{kpisTresMeses.averageYield.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}