import { useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, Target, AlertTriangle, BarChart3 } from "lucide-react";
import { useSupabaseCustosFixos } from "@/hooks/useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis } from "@/hooks/useSupabaseCustosVariaveis";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
export default function PontoEquilibrio() {
  const {
    custosFixos
  } = useSupabaseCustosFixos();
  const {
    custosVariaveis
  } = useSupabaseCustosVariaveis();
  const {
    faturamentoMensal,
    disponivel: faturamentoDisponivel
  } = useFaturamentoPrevisto();

  // Calculate normalized monthly value for fixed costs
  const calcularValorMensal = (custo: any): number => {
    let valorMensal = custo.valor;
    switch (custo.frequencia) {
      case "semanal":
        valorMensal *= 4.33;
        break;
      case "trimestral":
        valorMensal /= 3;
        break;
      case "semestral":
        valorMensal /= 6;
        break;
      case "anual":
        valorMensal /= 12;
        break;
    }
    return valorMensal;
  };

  // Calculate totals
  const totalCustosFixos = custosFixos.reduce((total, custo) => total + calcularValorMensal(custo), 0);
  const totalPercentualVariavel = custosVariaveis.reduce((total, custo) => {
    if (custo.frequencia === "por-producao") return total;
    return total + custo.percentual_faturamento;
  }, 0);
  const totalCustosVariaveis = custosVariaveis.reduce((total, custo) => {
    const percentualPart = faturamentoDisponivel ? faturamentoMensal * custo.percentual_faturamento / 100 : 0;
    return total + percentualPart + (custo.valor || 0);
  }, 0);

  // Break-even calculations
  const margemContribuicao = faturamentoDisponivel ? 1 - totalPercentualVariavel / 100 : 0;
  const pontoEquilibrioReais = margemContribuicao > 0 ? totalCustosFixos / margemContribuicao : 0;
  const margemSeguranca = faturamentoDisponivel && pontoEquilibrioReais > 0 ? (faturamentoMensal - pontoEquilibrioReais) / faturamentoMensal * 100 : 0;

  // Mock data for categories and channels (future: integrate with real data)
  const categorias = [{
    nome: "Revenda Padrão",
    precoMedio: 4.50,
    unidadesEquilibrio: Math.round(pontoEquilibrioReais * 0.4 / 4.50)
  }, {
    nome: "Food Service",
    precoMedio: 70.00,
    unidadesEquilibrio: Math.round(pontoEquilibrioReais * 0.3 / 70.00)
  }, {
    nome: "B2C UFCSPA",
    precoMedio: 5.50,
    unidadesEquilibrio: Math.round(pontoEquilibrioReais * 0.2 / 5.50)
  }, {
    nome: "Personalizados",
    precoMedio: 6.00,
    unidadesEquilibrio: Math.round(pontoEquilibrioReais * 0.1 / 6.00)
  }];

  // Chart data for break-even visualization
  const chartData = Array.from({
    length: 12
  }, (_, i) => {
    const faturamento = (i + 1) * (pontoEquilibrioReais / 6);
    const custosVariaveisChart = faturamento * (totalPercentualVariavel / 100);
    const custosTotal = totalCustosFixos + custosVariaveisChart;
    return {
      faturamento: Math.round(faturamento),
      custosFixos: Math.round(totalCustosFixos),
      custosVariaveis: Math.round(custosVariaveisChart),
      custosTotal: Math.round(custosTotal),
      resultado: Math.round(faturamento - custosTotal)
    };
  });

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  return <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader title="Ponto de Equilíbrio" description="Análise detalhada do break-even point da operação" />

      {/* Warning about data availability */}
      {!faturamentoDisponivel && <Card className="border-amber-200 bg-amber-50 mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Dados de faturamento necessários
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-700">
            <p>
              Para cálculos precisos do ponto de equilíbrio, configure dados na aba "Gestão Financeira &gt; Projeção de Resultados por PDV".
            </p>
          </CardContent>
        </Card>}

      {/* Main metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Faturamento de Equilíbrio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pontoEquilibrioReais)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Valor mínimo mensal para cobrir todos os custos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Margem de Contribuição
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(margemContribuicao * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Percentual que contribui para custos fixos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Margem de Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {margemSeguranca.toFixed(1)}%
            </div>
            <Badge variant={margemSeguranca > 20 ? "default" : margemSeguranca > 10 ? "secondary" : "destructive"} className="mt-1">
              {margemSeguranca > 20 ? "Segura" : margemSeguranca > 10 ? "Moderada" : "Risco"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Faturamento Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(faturamentoMensal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {faturamentoMensal > pontoEquilibrioReais ? "Acima" : "Abaixo"} do ponto de equilíbrio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Units needed by category */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Unidades por Categoria para Equilíbrio</CardTitle>
          <CardDescription>
            Quantidade estimada de unidades que precisam ser vendidas mensalmente por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categorias.map((categoria, index) => <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium text-sm text-muted-foreground">{categoria.nome}</h4>
                <div className="text-xl font-bold mt-1">
                  {categoria.unidadesEquilibrio.toLocaleString()} unidades
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Preço médio: {formatCurrency(categoria.precoMedio)}
                </p>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Break-even chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gráfico de Break-Even
          </CardTitle>
          <CardDescription>
            Visualização do ponto de equilíbrio: Faturamento vs. Custos
          </CardDescription>
        </CardHeader>
        <CardContent className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="faturamento" tickFormatter={value => `${(value / 1000).toFixed(0)}k`} className="text-sm" />
              <YAxis tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} labelFormatter={value => `Faturamento: ${formatCurrency(Number(value))}`} />
              <Legend />
              <Line type="monotone" dataKey="faturamento" stroke="#8b5cf6" name="Faturamento" strokeWidth={2} />
              <Line type="monotone" dataKey="custosTotal" stroke="#f59e0b" name="Custos Totais" strokeWidth={2} />
              <Line type="monotone" dataKey="custosFixos" stroke="#ef4444" name="Custos Fixos" strokeDasharray="5 5" />
              <Line type="monotone" dataKey="resultado" stroke="#10b981" name="Resultado" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>;
}