import { DollarSign, TrendingUp, Calculator, PieChart, Receipt, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOptimizedFinancialIndicators } from "@/hooks/useOptimizedFinancialIndicators";
import RefreshButton from "@/components/gestao-financeira/RefreshButton";

export default function ResumoFinanceiroTab() {
  const { data: financialData, loading, error, lastUpdated, refetch } = useOptimizedFinancialIndicators();

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const CardSkeleton = () => (
    <Card className="relative overflow-hidden border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 animate-pulse">
      <CardHeader className="pb-2">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-300 rounded w-2/3 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </CardContent>
    </Card>
  );

  const faturamentoMensal = financialData?.faturamentoMensal || 0;
  const totalCustosFixos = financialData?.totalCustosFixos || 0;
  const totalCustosVariaveis = financialData?.totalCustosVariaveis || 0;
  const totalCustoInsumos = financialData?.totalCustoInsumos || 0;
  const lucroOperacional = financialData?.lucroOperacional || 0;
  const margemBruta = financialData?.margemBruta || 0;
  const margemOperacional = financialData?.margemOperacional || 0;
  const pontoEquilibrio = financialData?.pontoEquilibrio || 0;
  const ticketMedio = financialData?.ticketMedio || 0;
  
  const totalCustos = totalCustosFixos + totalCustosVariaveis + totalCustoInsumos;
  const lucroBruto = faturamentoMensal - totalCustosVariaveis - totalCustoInsumos;
  const resultadoLiquido = lucroOperacional - (faturamentoMensal * 0.021);
  const margemLiquida = faturamentoMensal > 0 ? (resultadoLiquido / faturamentoMensal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header com Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Resumo Financeiro
          </h2>
          <p className="text-muted-foreground mt-1">Indicadores estratégicos - Valores mensais</p>
        </div>
        <RefreshButton onRefresh={refetch} lastUpdated={lastUpdated} />
      </div>

      {/* Primary Financial Metrics - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-bl-3xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800">Faturamento Mensal</CardTitle>
                <p className="text-xs text-blue-600">Base: Projeção de PDV</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 mb-2">
                  {formatCurrency(faturamentoMensal)}
                </div>
                <div className="text-sm text-blue-600">
                  Dados atualizados em tempo real
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
              <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/10 rounded-bl-3xl flex items-center justify-center">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-800">Lucro Bruto Mensal</CardTitle>
                <p className="text-xs text-green-600">Faturamento - Custos Variáveis</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 mb-2">
                  {formatCurrency(lucroBruto)}
                </div>
                <div className="flex items-center text-sm text-green-600">
                  <Target className="h-3 w-3 mr-1" />
                  Margem: {margemBruta.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/10 rounded-bl-3xl flex items-center justify-center">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-800">Margem Bruta</CardTitle>
                <p className="text-xs text-purple-600">% sobre faturamento</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700 mb-2">
                  {margemBruta.toFixed(1)}%
                </div>
                <div className="flex items-center text-sm text-purple-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Meta: 65%
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
              <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 rounded-bl-3xl flex items-center justify-center">
                <Receipt className="h-5 w-5 text-orange-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-orange-800">Custos Totais</CardTitle>
                <p className="text-xs text-orange-600">Fixos + Variáveis + Insumos</p>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700 mb-2">
                  {formatCurrency(totalCustos)}
                </div>
                <div className="text-xs text-orange-600 space-y-1">
                  <div>Fixos: {formatCurrency(totalCustosFixos)}</div>
                  <div>Variáveis: {formatCurrency(totalCustosVariaveis)}</div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Secondary Financial Metrics */}
      <div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Resultados e Indicadores
          </h3>
          <p className="text-sm text-muted-foreground">Análise detalhada dos resultados operacionais</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-slate-500/10 rounded-bl-3xl flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-slate-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Lucro Operacional
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Após custos fixos</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-700 mb-1">
                    {formatCurrency(lucroOperacional)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margem: {margemOperacional.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-3xl flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Resultado Líquido
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Após impostos</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-700 mb-1">
                    {formatCurrency(resultadoLiquido)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Margem: {margemLiquida.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100">
                <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/10 rounded-bl-3xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-cyan-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-cyan-800">
                    Ponto de Equilíbrio
                  </CardTitle>
                  <p className="text-xs text-cyan-600">Faturamento mínimo mensal</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-700 mb-1">
                    {formatCurrency(pontoEquilibrio)}
                  </div>
                  <div className="text-xs text-cyan-600">
                    Calculado dinamicamente
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
                <div className="absolute top-0 right-0 w-12 h-12 bg-amber-500/10 rounded-bl-3xl flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-amber-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-amber-800">
                    Ticket Médio
                  </CardTitle>
                  <p className="text-xs text-amber-600">Base: Histórico de entregas</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-700 mb-1">
                    {formatCurrency(ticketMedio)}
                  </div>
                  <div className="text-xs text-amber-600">
                    Dados reais do último mês
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Warning Alerts */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Erro ao carregar dados financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-700">
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && faturamentoMensal === 0 && (
        <Card className="border-amber-200 bg-amber-50 mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Dados de projeção não disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-amber-700">
            <p>
              Configure clientes com categorias habilitadas na aba "Projeção por PDV" 
              para visualizar cálculos mais precisos baseados em dados reais.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
