import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";
import { useOptimizedFinancialData } from "@/hooks/useOptimizedFinancialData";
import { useFaturamentoPrevisto } from "@/hooks/useFaturamentoPrevisto";
import { useClienteStore } from "@/hooks/useClienteStore";
import BreakEvenPorProduto from "@/components/gestao-financeira/BreakEvenPorProduto";

export default function PontoEquilibrio() {
  const { data: financialData, loading, error } = useOptimizedFinancialData();
  const faturamentoPrevisto = useFaturamentoPrevisto();
  const { clientes } = useClienteStore();

  // Memoize calculations to prevent unnecessary recalculations
  const calculations = useMemo(() => {
    if (!financialData || !faturamentoPrevisto.precosDetalhados) return null;

    const { faturamento, custosFixos, custosVariaveis } = financialData;
    
    const faturamentoMensal = faturamento.mensal;
    const custoFixoTotal = custosFixos.total;
    const custoVariavelTotal = custosVariaveis.total;
    
    const margem = faturamentoMensal - custoFixoTotal - custoVariavelTotal;
    const margemPercentual = faturamentoMensal > 0 ? (margem / faturamentoMensal) * 100 : 0;
    
    // Filtrar clientes que devem ser contabilizados (mesma lógica do ResumoGeralTab)
    const clientesContabilizados = clientes.filter(cliente => cliente.contabilizarGiroMedio);
    const clientesContabilizadosIds = new Set(clientesContabilizados.map(c => c.id));
    
    // Função para verificar se é categoria "Revenda Padrão"
    const isRevendaPadrao = (categoriaNome: string): boolean => {
      const nome = categoriaNome.toLowerCase();
      return nome.includes('revenda') || nome.includes('padrão');
    };
    
    // Filtrar dados apenas de clientes contabilizados e categoria Revenda Padrão
    const dadosRevendaPadrao = faturamentoPrevisto.precosDetalhados.filter(detalhe => 
      clientesContabilizadosIds.has(detalhe.clienteId) && isRevendaPadrao(detalhe.categoriaNome)
    );
    
    // Calcular preço médio ponderado baseado apenas na Revenda Padrão (mesma lógica do ResumoGeralTab)
    let faturamentoTotalRevendaPadrao = 0;
    let volumeTotalRevendaPadrao = 0;
    
    dadosRevendaPadrao.forEach(detalhe => {
      const faturamentoMensalDetalhe = detalhe.faturamentoSemanal * 4;
      const volumeMensalDetalhe = detalhe.giroSemanal * 4;
      
      faturamentoTotalRevendaPadrao += faturamentoMensalDetalhe;
      volumeTotalRevendaPadrao += volumeMensalDetalhe;
    });
    
    // Preço médio ponderado correto (R$ 4,25) - baseado apenas em Revenda Padrão
    const precoMedioPonderado = volumeTotalRevendaPadrao > 0 ? faturamentoTotalRevendaPadrao / volumeTotalRevendaPadrao : 0;
    
    // Para o cálculo de custos, usar todos os dados (não apenas Revenda Padrão)
    let faturamentoTotalGeral = 0;
    let volumeTotalGeral = 0;
    
    faturamentoPrevisto.precosDetalhados.forEach(detalhe => {
      const faturamentoMensalDetalhe = detalhe.faturamentoSemanal * 4;
      const volumeMensalDetalhe = detalhe.giroSemanal * 4;
      
      faturamentoTotalGeral += faturamentoMensalDetalhe;
      volumeTotalGeral += volumeMensalDetalhe;
    });
    
    // Custo unitário médio baseado nos custos variáveis totais
    const custoUnitarioMedio = volumeTotalGeral > 0 ? custoVariavelTotal / volumeTotalGeral : 0;
    
    // Margem de contribuição unitária usando preço médio da Revenda Padrão
    const margemContribuicaoUnitaria = precoMedioPonderado - custoUnitarioMedio;
    
    // Unidades necessárias para break even (custos fixos ÷ margem unitária)
    const unidadesBreakEven = margemContribuicaoUnitaria > 0 ? Math.ceil(custoFixoTotal / margemContribuicaoUnitaria) : 0;
    
    // Faturamento necessário para break even = unidades × preço médio da Revenda Padrão
    const faturamentoBreakEven = unidadesBreakEven * precoMedioPonderado;
    
    return {
      faturamentoMensal,
      custoFixoTotal,
      custoVariavelTotal,
      margem,
      margemPercentual,
      precoMedioPonderado,
      custoUnitarioMedio,
      margemContribuicaoUnitaria,
      unidadesBreakEven,
      faturamentoBreakEven,
      volumeTotalMensal: volumeTotalGeral
    };
  }, [financialData, faturamentoPrevisto.precosDetalhados, clientes]);

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
    precoMedioPonderado,
    unidadesBreakEven,
    faturamentoBreakEven,
    volumeTotalMensal,
    margemContribuicaoUnitaria
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
                  {formatCurrency(faturamentoBreakEven)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Faturamento necessário para cobrir todos os custos
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Unidades Necessárias:</span>
                  <span className="text-sm font-medium">{unidadesBreakEven.toLocaleString()} un</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Preço Médio (Revenda):</span>
                  <span className="text-sm font-medium">{formatCurrency(precoMedioPonderado)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Margem Unit.:</span>
                  <span className="text-sm font-medium">{formatCurrency(margemContribuicaoUnitaria)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm">Faturamento Atual:</span>
                  <span className="text-sm font-medium">{formatCurrency(faturamentoMensal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Diferença:</span>
                  <span className={`text-sm font-medium ${faturamentoMensal >= faturamentoBreakEven ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(faturamentoMensal - faturamentoBreakEven)}
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
              {faturamentoMensal >= faturamentoBreakEven ? (
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
                {faturamentoMensal >= faturamentoBreakEven 
                  ? "O faturamento atual está acima do ponto de equilíbrio, gerando lucro."
                  : `É necessário vender ${(unidadesBreakEven - volumeTotalMensal).toLocaleString()} unidades adicionais ou aumentar o preço médio para atingir o break even.`
                }
              </div>
              
              <div className="text-xs text-muted-foreground mt-4">
                <div>Volume atual: {volumeTotalMensal.toLocaleString()} un/mês</div>
                <div>Volume necessário: {unidadesBreakEven.toLocaleString()} un/mês</div>
                <div className="mt-2 text-orange-600">
                  * Preço médio baseado apenas em clientes Revenda Padrão contabilizados
                </div>
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
