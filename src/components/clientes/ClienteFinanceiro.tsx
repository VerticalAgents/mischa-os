import { useState } from "react";
import { Cliente } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, TrendingUp, TrendingDown, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useClienteFinanceiro } from "@/hooks/useClienteFinanceiro";
interface ClienteFinanceiroProps {
  cliente: Cliente;
}
export default function ClienteFinanceiro({
  cliente
}: ClienteFinanceiroProps) {
  const [isCustosOpen, setIsCustosOpen] = useState(false);
  const [isProdutosOpen, setIsProdutosOpen] = useState(false);
  
  const {
    dadosFinanceiros,
    isLoading,
    error
  } = useClienteFinanceiro(cliente);
  if (isLoading) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Carregando dados financeiros...</p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-destructive">Erro ao carregar dados financeiros</p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  if (!dadosFinanceiros) {
    return null;
  }

  // Verificar se há categorias habilitadas
  const temCategoriasHabilitadas = cliente.categoriasHabilitadas && cliente.categoriasHabilitadas.length > 0;
  if (!temCategoriasHabilitadas) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">Nenhuma categoria de produto habilitada para este cliente.</p>
              <p className="text-sm text-muted-foreground">
                Configure as categorias na aba "Informações" para visualizar os dados financeiros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  const temDados = dadosFinanceiros.quantidadesMedias.length > 0;
  if (!temDados) {
    return <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">Ainda não há entregas suficientes para calcular médias financeiras.</p>
              <p className="text-sm text-muted-foreground">
                Os dados serão exibidos após as primeiras entregas serem confirmadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Banner informativo */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm">
          📊 <strong>Análise baseada nas últimas 12 semanas</strong> de histórico de entregas
        </p>
      </div>

      {/* Grid 2 colunas - Blocos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Resumo Financeiro Mensal */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Resumo Financeiro Mensal
                </CardTitle>
                <CardDescription className="text-left">
                  Projeção baseada nas últimas 12 semanas
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Geral - Destaque */}
              <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">
                  Faturamento Médio Mensal
                </p>
                <p className="text-3xl font-bold text-primary">
                  R$ {dadosFinanceiros.resumoMensal.faturamentoMedio.toFixed(2)}
                </p>
                <Badge variant="default" className="mt-2">
                  {dadosFinanceiros.resumoMensal.quantidadeEntregasMes} entregas/mês
                </Badge>
              </div>

              {/* Custos Operacionais - Collapsible */}
              <Collapsible open={isCustosOpen} onOpenChange={setIsCustosOpen}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-muted-foreground">
                    Detalhes de Custos
                  </p>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      {isCustosOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent className="space-y-2">
                  {/* Custo de Produtos */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Custo de Produtos</span>
                    </div>
                    <span className="font-medium text-sm">
                      R$ {dadosFinanceiros.resumoMensal.custoProdutos.toFixed(2)}
                    </span>
                  </div>

                  {/* Custo Logístico (se aplicável) */}
                  {(cliente.tipoLogistica?.toUpperCase() === 'PROPRIA' || cliente.tipoLogistica === 'Própria') && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Custo Logístico</span>
                      </div>
                      <span className="font-medium text-sm text-orange-600">
                        R$ {dadosFinanceiros.resumoMensal.custoLogistico.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Imposto (se aplicável) */}
                  {cliente.emiteNotaFiscal && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">Imposto (4%)</span>
                      </div>
                      <span className="font-medium text-sm text-purple-600">
                        R$ {dadosFinanceiros.resumoMensal.impostoEstimado.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Taxa Boleto (se aplicável) */}
                  {(cliente.formaPagamento?.toUpperCase() === 'BOLETO' || cliente.formaPagamento === 'Boleto') && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-pink-500" />
                        <span className="text-sm">Taxa Boleto</span>
                      </div>
                      <span className="font-medium text-sm text-pink-600">
                        R$ {dadosFinanceiros.resumoMensal.taxaBoleto.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Total de Custos */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg font-medium">
                    <span className="text-sm">Total de Custos</span>
                    <span className="text-sm">
                      R$ {dadosFinanceiros.resumoMensal.totalCustosOperacionais.toFixed(2)}
                    </span>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Margem Bruta */}
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700 dark:text-green-400">
                    Margem Bruta
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-800 dark:text-green-300">
                      R$ {dadosFinanceiros.resumoMensal.margemBruta.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600 dark:text-green-400">
                      {dadosFinanceiros.resumoMensal.margemBrutaPercentual.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Preços Aplicados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Preços Aplicados
            </CardTitle>
            <CardDescription className="text-left">
              Por categoria habilitada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dadosFinanceiros.precosCategoria.map(item => (
                <div 
                  key={item.categoriaId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.categoriaNome}</span>
                    <Badge variant={item.fonte === 'personalizado' ? 'default' : 'secondary'} 
                           className="text-xs">
                      {item.fonte === 'personalizado' ? '⭐' : '📋'}
                    </Badge>
                  </div>
                  <span className="text-base font-bold text-primary">
                    R$ {item.precoUnitario.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quantidades Médias - Largura total */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Quantidades Médias Semanais
          </CardTitle>
          <CardDescription className="text-left">
            Últimas 12 semanas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">
                Total Médio Semanal
              </p>
              <p className="text-3xl font-bold text-primary">
                {dadosFinanceiros.quantidadesMedias.reduce(
                  (sum, item) => sum + item.quantidadeMediaSemanal, 0
                )} un/sem
              </p>
              <Badge variant="default" className="mt-2">
                {dadosFinanceiros.quantidadesMedias.length} produtos
              </Badge>
            </div>

            {/* Lista de Produtos - Collapsible */}
            <Collapsible open={isProdutosOpen} onOpenChange={setIsProdutosOpen}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Detalhes por Produto
                </p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    {isProdutosOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="space-y-2">
                {dadosFinanceiros.quantidadesMedias
                  .sort((a, b) => b.quantidadeMediaSemanal - a.quantidadeMediaSemanal)
                  .map(item => (
                    <div 
                      key={item.produtoId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.produtoNome}</span>
                      </div>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {item.quantidadeMediaSemanal} un/sem
                      </Badge>
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* 4. Custos por Categoria - Largura total */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Custos Médios por Categoria
          </CardTitle>
          <CardDescription className="text-left">
            Custo ponderado baseado nas vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dadosFinanceiros.custosCategoria.map(item => (
              <div 
                key={item.categoriaId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{item.categoriaNome}</span>
                <span className="text-base font-bold text-primary">
                  R$ {item.custoMedio.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>;
}