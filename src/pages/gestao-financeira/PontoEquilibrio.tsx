
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

  const calculations = useMemo(() => {
    if (!financialData || !faturamentoPrevisto.precosDetalhados) return null;

    const { faturamento, custosFixos, custosVariaveis } = financialData;
    
    // Dados básicos
    const faturamentoMensal = faturamento.mensal;
    const custoFixoTotal = custosFixos.total;
    const custoVariavelTotal = custosVariaveis.total;
    
    // Margem atual
    const margem = faturamentoMensal - custoFixoTotal - custoVariavelTotal;
    const margemPercentual = faturamentoMensal > 0 ? (margem / faturamentoMensal) * 100 : 0;
    
    // Filtrar clientes contabilizados
    const clientesContabilizados = clientes.filter(cliente => cliente.contabilizarGiroMedio);
    const clientesContabilizadosIds = new Set(clientesContabilizados.map(c => c.id));
    
    // Filtrar dados apenas de clientes contabilizados
    const dadosContabilizados = faturamentoPrevisto.precosDetalhados.filter(detalhe => 
      clientesContabilizadosIds.has(detalhe.clienteId)
    );
    
    // Separar por categoria
    const dadosRevendaPadrao = dadosContabilizados.filter(detalhe => {
      const nome = detalhe.categoriaNome.toLowerCase();
      return nome.includes('revenda') || nome.includes('padrão');
    });
    
    const dadosFoodService = dadosContabilizados.filter(detalhe => {
      const nome = detalhe.categoriaNome.toLowerCase();
      return nome.includes('food service') || nome.includes('foodservice');
    });
    
    // Calcular totais de Revenda Padrão
    let faturamentoRevendaPadrao = 0;
    let volumeRevendaPadrao = 0;
    
    dadosRevendaPadrao.forEach(detalhe => {
      const faturamentoMensal = detalhe.faturamentoSemanal * 4;
      const volumeMensal = detalhe.giroSemanal * 4;
      
      faturamentoRevendaPadrao += faturamentoMensal;
      volumeRevendaPadrao += volumeMensal;
    });
    
    // Calcular totais de Food Service
    let faturamentoFoodService = 0;
    let volumeFoodService = 0;
    
    dadosFoodService.forEach(detalhe => {
      const faturamentoMensal = detalhe.faturamentoSemanal * 4;
      const volumeMensal = detalhe.giroSemanal * 4;
      
      faturamentoFoodService += faturamentoMensal;
      volumeFoodService += volumeMensal;
    });
    
    // Preços médios por categoria
    const precoMedioRevendaPadrao = volumeRevendaPadrao > 0 ? faturamentoRevendaPadrao / volumeRevendaPadrao : 0;
    const precoMedioFoodService = volumeFoodService > 0 ? faturamentoFoodService / volumeFoodService : 0;
    
    // Volume total mensal
    const volumeTotalMensal = volumeRevendaPadrao + volumeFoodService;
    
    // Custo unitário médio baseado nos custos variáveis
    const custoUnitarioMedio = volumeTotalMensal > 0 ? custoVariavelTotal / volumeTotalMensal : 0;
    
    // Para o cálculo de break even, usar apenas Revenda Padrão (conforme acordado)
    const margemContribuicaoUnitaria = precoMedioRevendaPadrao - custoUnitarioMedio;
    
    // Unidades necessárias para break even
    const unidadesBreakEven = margemContribuicaoUnitaria > 0 ? Math.ceil(custoFixoTotal / margemContribuicaoUnitaria) : 0;
    
    // Faturamento necessário para break even
    const faturamentoBreakEven = unidadesBreakEven * precoMedioRevendaPadrao;
    
    return {
      faturamentoMensal,
      custoFixoTotal,
      custoVariavelTotal,
      margem,
      margemPercentual,
      precoMedioRevendaPadrao,
      precoMedioFoodService,
      custoUnitarioMedio,
      margemContribuicaoUnitaria,
      unidadesBreakEven,
      faturamentoBreakEven,
      volumeTotalMensal,
      volumeRevendaPadrao,
      volumeFoodService,
      faturamentoRevendaPadrao,
      faturamentoFoodService
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
    precoMedioRevendaPadrao,
    precoMedioFoodService,
    custoUnitarioMedio,
    margemContribuicaoUnitaria,
    unidadesBreakEven,
    faturamentoBreakEven,
    volumeTotalMensal,
    volumeRevendaPadrao,
    volumeFoodService,
    faturamentoRevendaPadrao,
    faturamentoFoodService
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

      {/* Cards de Resumo Financeiro */}
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

      {/* Análise Detalhada por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h4 className="font-semibold text-blue-600 mb-2">Revenda Padrão</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Faturamento:</span>
                    <div className="font-medium">{formatCurrency(faturamentoRevendaPadrao)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <div className="font-medium">{volumeRevendaPadrao.toLocaleString()} un</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Médio:</span>
                    <div className="font-bold text-blue-600">{formatCurrency(precoMedioRevendaPadrao)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo Unit.:</span>
                    <div className="font-medium">{formatCurrency(custoUnitarioMedio)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-orange-600 mb-2">Food Service</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Faturamento:</span>
                    <div className="font-medium">{formatCurrency(faturamentoFoodService)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Volume:</span>
                    <div className="font-medium">{volumeFoodService.toLocaleString()} un</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Preço Médio:</span>
                    <div className="font-bold text-orange-600">{formatCurrency(precoMedioFoodService)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Custo Unit.:</span>
                    <div className="font-medium">{formatCurrency(custoUnitarioMedio)}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ponto de Equilíbrio</CardTitle>
            <p className="text-sm text-muted-foreground">Baseado na categoria Revenda Padrão</p>
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
                  <span className="text-sm font-bold">{unidadesBreakEven.toLocaleString()} un</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Preço Médio (Revenda):</span>
                  <span className="text-sm font-medium">{formatCurrency(precoMedioRevendaPadrao)}</span>
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
                  <span className={`text-sm font-bold ${faturamentoMensal >= faturamentoBreakEven ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(faturamentoMensal - faturamentoBreakEven)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Situação */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Situação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faturamentoMensal >= faturamentoBreakEven ? (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-5 w-5" />
                <span className="font-medium">Situação Positiva - Acima do Break Even</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Atenção - Abaixo do Break Even</span>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              {faturamentoMensal >= faturamentoBreakEven 
                ? `O faturamento atual está ${formatCurrency(faturamentoMensal - faturamentoBreakEven)} acima do ponto de equilíbrio, gerando lucro operacional.`
                : `É necessário aumentar o faturamento em ${formatCurrency(faturamentoBreakEven - faturamentoMensal)} ou vender ${(unidadesBreakEven - volumeTotalMensal).toLocaleString()} unidades adicionais para atingir o break even.`
              }
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground mt-4 pt-4 border-t">
              <div>
                <div className="font-medium">Volume Atual:</div>
                <div>{volumeTotalMensal.toLocaleString()} un/mês</div>
              </div>
              <div>
                <div className="font-medium">Volume Necessário:</div>
                <div>{unidadesBreakEven.toLocaleString()} un/mês</div>
              </div>
              <div>
                <div className="font-medium">Gap:</div>
                <div className={unidadesBreakEven > volumeTotalMensal ? 'text-red-600' : 'text-green-600'}>
                  {(unidadesBreakEven - volumeTotalMensal).toLocaleString()} un
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Componente de Break Even por Produto */}
      <BreakEvenPorProduto 
        faturamentoPrevisto={faturamentoPrevisto}
        custoFixoTotal={custoFixoTotal}
      />
    </div>
  );
}
