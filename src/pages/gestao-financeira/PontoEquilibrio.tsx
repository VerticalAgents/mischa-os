
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { useOptimizedFinancialData } from "@/hooks/useOptimizedFinancialData";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";
import BreakEvenPorProduto from "@/components/gestao-financeira/BreakEvenPorProduto";

export default function PontoEquilibrio() {
  const { data: financialData, loading, error } = useOptimizedFinancialData();
  const faturamentoPrevisto = useFaturamentoPrevisto();

  // Memoize calculations to prevent unnecessary recalculations
  const calculations = useMemo(() => {
    if (!financialData) return null;

    const { faturamento, custosFixos, custosVariaveis } = financialData;
    
    const faturamentoMensal = faturamento.mensal;
    const custoFixoTotal = custosFixos.total;
    const custoVariavelTotal = custosVariaveis.total;
    
    const margem = faturamentoMensal - custoFixoTotal - custoVariavelTotal;
    const margemPercentual = faturamentoMensal > 0 ? (margem / faturamentoMensal) * 100 : 0;
    
    // Ponto de equilíbrio: Custos Fixos / (Receita - Custos Variáveis) * Receita
    const margemContribuicao = faturamentoMensal - custoVariavelTotal;
    const pontoEquilibrio = margemContribuicao > 0 ? (custoFixoTotal / margemContribuicao) * faturamentoMensal : 0;
    
    return {
      faturamentoMensal,
      custoFixoTotal,
      custoVariavelTotal,
      margem,
      margemPercentual,
      pontoEquilibrio,
      margemContribuicao
    };
  }, [financialData]);

  if (loading || faturamentoPrevisto.isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!calculations) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Dados financeiros não disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  const {
    faturamentoMensal,
    custoFixoTotal,
    custoVariavelTotal,
    margem,
    margemPercentual,
    pontoEquilibrio
  } = calculations;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Ponto de Equilíbrio</h2>
        <p className="text-muted-foreground">
          Análise do ponto de equilíbrio baseado no faturamento previsto e custos atuais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(faturamentoMensal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(custoFixoTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Variáveis</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(custoVariavelTotal)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem Líquida</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(margem)}
            </div>
            <Badge variant={margem >= 0 ? "default" : "destructive"} className="mt-1">
              {margemPercentual.toFixed(1)}%
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ponto de Equilíbrio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(pontoEquilibrio)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Faturamento necessário para cobrir todos os custos
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Faturamento Atual:</span>
                  <span className="text-sm font-medium">{formatCurrency(faturamentoMensal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Diferença:</span>
                  <span className={`text-sm font-medium ${faturamentoMensal >= pontoEquilibrio ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(faturamentoMensal - pontoEquilibrio)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise de Risco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {faturamentoMensal >= pontoEquilibrio ? (
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="font-medium">Situação Positiva</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Atenção Necessária</span>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                {faturamentoMensal >= pontoEquilibrio 
                  ? "O faturamento atual está acima do ponto de equilíbrio, gerando lucro."
                  : "O faturamento atual está abaixo do ponto de equilíbrio. Considere aumentar as vendas ou reduzir custos."
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nova seção Break Even por Produto */}
      <BreakEvenPorProduto 
        faturamentoPrevisto={faturamentoPrevisto}
        custoFixoTotal={custoFixoTotal}
      />
    </div>
  );
}
