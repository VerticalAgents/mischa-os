
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import BreadcrumbNavigation from "@/components/common/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Receipt, DollarSign, FileText, ArrowRight, TrendingUp, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { useSupabaseCustosFixos } from "@/hooks/useSupabaseCustosFixos";
import { useSupabaseCustosVariaveis } from "@/hooks/useSupabaseCustosVariaveis";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";

export default function GestaoFinanceira() {
  const navigate = useNavigate();
  const { custosFixos } = useSupabaseCustosFixos();
  const { custosVariaveis } = useSupabaseCustosVariaveis();
  const { faturamentoMensal, disponivel: faturamentoDisponivel } = useFaturamentoPrevisto();

  // Calculate normalized monthly value for fixed costs
  const calcularValorMensal = (custo: any): number => {
    let valorMensal = custo.valor;
    switch (custo.frequencia) {
      case "semanal": valorMensal *= 4.33; break;
      case "trimestral": valorMensal /= 3; break;
      case "semestral": valorMensal /= 6; break;
      case "anual": valorMensal /= 12; break;
    }
    return valorMensal;
  };

  // Calculate totals
  const totalCustosFixos = custosFixos.reduce((total, custo) => total + calcularValorMensal(custo), 0);
  
  const totalCustosVariaveis = custosVariaveis.reduce((total, custo) => {
    const percentualPart = faturamentoDisponivel 
      ? (faturamentoMensal * custo.percentual_faturamento) / 100
      : 0;
    return total + percentualPart + (custo.valor || 0);
  }, 0);

  // Financial calculations
  const lucroBruto = faturamentoMensal - totalCustosVariaveis;
  const lucroOperacional = lucroBruto - totalCustosFixos;
  const impostos = faturamentoMensal * 0.04; // 4% sobre faturamento
  const resultadoLiquido = lucroOperacional - impostos;
  const ticketMedio = 47.50; // Mockado - futuro: calcular com base no histórico
  const desvioFaturamento = 0; // Mockado - futuro: faturamento realizado vs projetado

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  return (
    <div className="container mx-auto">
      <BreadcrumbNavigation />
      
      <PageHeader
        title="Gestão Financeira"
        description="Visão geral da gestão financeira e DREs da empresa"
      />

      {/* Resumo Financeiro Expandido */}
      <div className="mt-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">Resumo Financeiro</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturamento Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {faturamentoDisponivel ? formatCurrency(faturamentoMensal) : "R$ 0"}
              </div>
              <p className="text-xs text-green-600 flex items-center">
                +12% em relação ao mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Custos Totais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCustosFixos + totalCustosVariaveis)}
              </div>
              <p className="text-xs text-amber-600 flex items-center">
                Fixos: {formatCurrency(totalCustosFixos)} | Variáveis: {formatCurrency(totalCustosVariaveis)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lucro Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(lucroBruto)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {faturamentoMensal > 0 ? ((lucroBruto / faturamentoMensal) * 100).toFixed(1) : "0"}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lucro Operacional
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(lucroOperacional)}
              </div>
              <p className="text-xs text-muted-foreground">
                Margem: {faturamentoMensal > 0 ? ((lucroOperacional / faturamentoMensal) * 100).toFixed(1) : "0"}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resultado Líquido Projetado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(resultadoLiquido)}
              </div>
              <p className="text-xs text-muted-foreground">
                Após impostos (4%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ticket Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(ticketMedio)}
              </div>
              <p className="text-xs text-muted-foreground">
                Por pedido (em desenvolvimento)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ponto de Equilíbrio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalCustosFixos + totalCustosVariaveis)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita mínima mensal necessária
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Desvio de Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(desvioFaturamento)}
              </div>
              <p className="text-xs text-muted-foreground">
                Realizado vs Projetado (em desenvolvimento)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blocos de Navegação */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <LineChart className="mr-2 h-5 w-5" />
              Projeções
            </CardTitle>
            <CardDescription>
              Cenários e análises financeiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Simule diferentes cenários de crescimento e explore o impacto financeiro de suas decisões.
            </p>
            <Button onClick={() => navigate("/projecoes")} className="w-full">
              Acessar Projeções
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Receipt className="mr-2 h-5 w-5" />
              Custos
            </CardTitle>
            <CardDescription>
              Controle detalhado de custos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Gerencie todos os custos da operação, categorizados por tipo, frequência e área.
            </p>
            <Button onClick={() => navigate("/custos")} className="w-full">
              Gerenciar Custos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Projeção por PDV
            </CardTitle>
            <CardDescription>
              Análise de rentabilidade por cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Projete resultados específicos por ponto de venda com base na precificação personalizada.
            </p>
            <Button onClick={() => navigate("/gestao-financeira/projecao-resultados-pdv")} className="w-full" variant="outline">
              Em Desenvolvimento
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Ponto de Equilíbrio
            </CardTitle>
            <CardDescription>
              Análise detalhada do break-even
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Calcule o ponto de equilíbrio por categoria, canal e cenários de crescimento.
            </p>
            <Button onClick={() => navigate("/gestao-financeira/ponto-equilibrio")} className="w-full">
              Analisar Break-Even
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
