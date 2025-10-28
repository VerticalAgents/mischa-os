import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProductionAnalytics } from "@/hooks/useProductionAnalytics";
import { TrendingUp, TrendingDown, Package, Calendar, Factory, Filter } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subYears, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
export default function HistoricoAnalytics() {
  const [filtrarPorProporcao, setFiltrarPorProporcao] = useState(false);
  const { proporcoes, loading: loadingProporcoes } = useSupabaseProporoesPadrao();
  const { categorias } = useSupabaseCategoriasProduto();
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

  // Últimos 90 dias - Revenda Padrão
  const inicio90Dias = subDays(hoje, 90);
  const categoriaRevenda = categorias.find(c => c.nome.toLowerCase().includes('revenda'));
  const categoriaFoodService = categorias.find(c => c.nome.toLowerCase().includes('food'));
  
  const {
    kpis: kpisRevenda90Dias
  } = useProductionAnalytics({
    startDate: inicio90Dias,
    endDate: hoje,
    aggregation: 'day',
    categoriaId: categoriaRevenda?.id
  });

  // Últimos 90 dias - Food Service
  const {
    kpis: kpisFoodService90Dias
  } = useProductionAnalytics({
    startDate: inicio90Dias,
    endDate: hoje,
    aggregation: 'day',
    categoriaId: categoriaFoodService?.id
  });

  // Últimos 90 dias - Todos os produtos (para o card de produção por produto)
  const {
    kpis: kpis90Dias,
    topProducts: produtos90Dias
  } = useProductionAnalytics({
    startDate: inicio90Dias,
    endDate: hoje,
    aggregation: 'day'
  });

  // Cálculos de variação
  const variacaoMesAnterior = kpisMesAnterior.totalUnitsProduced > 0 ? (kpisMesAtual.totalUnitsProduced - kpisMesAnterior.totalUnitsProduced) / kpisMesAnterior.totalUnitsProduced * 100 : 0;
  const variacaoAnoAnterior = kpisMesmoMesAnoPassado.totalUnitsProduced > 0 ? (kpisMesAtual.totalUnitsProduced - kpisMesmoMesAnoPassado.totalUnitsProduced) / kpisMesmoMesAnoPassado.totalUnitsProduced * 100 : 0;

  // Criar mapa de proporções para lookup rápido
  const proporcoesMap = useMemo(() => {
    return new Map(proporcoes.map(p => [p.produto_nome, p.percentual]));
  }, [proporcoes]);

  // Filtrar produtos baseado no toggle e recalcular percentuais
  const produtosFiltrados = useMemo(() => {
    if (filtrarPorProporcao) {
      // Filtrar produtos com proporção > 0
      const filtrados = produtos90Dias.filter(produto => {
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
    return produtos90Dias;
  }, [produtos90Dias, filtrarPorProporcao, proporcoesMap]);
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

      {/* Estatísticas dos Últimos 90 Dias - Por Categoria */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produção Revenda Últimos 90 dias
            </CardTitle>
            <CardDescription className="text-left">
              Unidades produzidas - Revenda Padrão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {kpisRevenda90Dias.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {kpisRevenda90Dias.totalFormsProduced.toLocaleString('pt-BR')} formas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produção Food-Service Últimos 90 dias
            </CardTitle>
            <CardDescription className="text-left">
              Unidades produzidas - Food-Service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {kpisFoodService90Dias.totalUnitsProduced.toLocaleString('pt-BR')} un
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {kpisFoodService90Dias.totalFormsProduced.toLocaleString('pt-BR')} formas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Produção por Produto
                </CardTitle>
                <CardDescription className="text-left">
                  Distribuição dos últimos 90 dias
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="filtro-proporcao-historico" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                  <Filter className="h-4 w-4 inline mr-1" />
                  Apenas com proporção
                </Label>
                <Switch 
                  id="filtro-proporcao-historico"
                  checked={filtrarPorProporcao}
                  onCheckedChange={setFiltrarPorProporcao}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtosFiltrados.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {filtrarPorProporcao 
                    ? 'Nenhum produto com proporção padrão configurada'
                    : 'Nenhum produto encontrado no período'
                  }
                </div>
              ) : (
                produtosFiltrados.map((produto) => (
                  <div key={produto.productName} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{produto.productName}</span>
                      <span className="text-muted-foreground">
                        {produto.totalForms.toLocaleString('pt-BR')} formas ({produto.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${produto.percentage}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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