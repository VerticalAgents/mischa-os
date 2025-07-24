
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, Calculator, BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface BreakEvenPorProdutoProps {
  faturamentoPrevisto: {
    precosDetalhados: Array<{
      categoriaNome: string;
      precoUnitario: number;
      faturamentoSemanal: number;
      giroSemanal: number;
    }>;
  };
  custoFixoTotal: number;
}

export default function BreakEvenPorProduto({ faturamentoPrevisto, custoFixoTotal }: BreakEvenPorProdutoProps) {
  const breakEvenData = useMemo(() => {
    if (!faturamentoPrevisto?.precosDetalhados) return [];

    // Agrupar por categoria e calcular preço médio
    const categoriaData = new Map<string, { precoMedio: number; volumeSemanal: number; faturamentoTotal: number }>();
    
    faturamentoPrevisto.precosDetalhados.forEach(detalhe => {
      const categoria = detalhe.categoriaNome;
      const existing = categoriaData.get(categoria) || { precoMedio: 0, volumeSemanal: 0, faturamentoTotal: 0 };
      
      categoriaData.set(categoria, {
        precoMedio: detalhe.precoUnitario, // Usar o preço unitário diretamente
        volumeSemanal: existing.volumeSemanal + detalhe.giroSemanal,
        faturamentoTotal: existing.faturamentoTotal + detalhe.faturamentoSemanal
      });
    });

    // Preços médios corretos conforme solicitado
    const precosMediosCorretos: Record<string, number> = {
      'revenda padrão': 4.25, // Preço correto da página de projeção por PDV
      'food service': 70.00,  // Valor mock solicitado
      'ufcspa': 70.00,
      'personalizados': 70.00,
      'outros': 4.25
    };

    // Custos unitários por categoria
    const custosUnitarios: Record<string, number> = {
      'revenda padrão': 1.41,
      'food service': 29.17,
      'ufcspa': 29.17,
      'personalizados': 29.17,
      'outros': 1.41
    };

    const getPrecoMedio = (categoriaNome: string): number => {
      const nome = categoriaNome.toLowerCase();
      for (const [key, preco] of Object.entries(precosMediosCorretos)) {
        if (nome.includes(key.toLowerCase()) || key.includes(nome)) {
          return preco;
        }
      }
      return precosMediosCorretos['outros'];
    };

    const getCustoUnitario = (categoriaNome: string): number => {
      const nome = categoriaNome.toLowerCase();
      for (const [key, custo] of Object.entries(custosUnitarios)) {
        if (nome.includes(key.toLowerCase()) || key.includes(nome)) {
          return custo;
        }
      }
      return custosUnitarios['outros'];
    };

    return Array.from(categoriaData.entries()).map(([categoria, data]) => {
      const precoMedio = getPrecoMedio(categoria);
      const custoUnitario = getCustoUnitario(categoria);
      const margemBrutaUnitaria = Math.max(0, precoMedio - custoUnitario);
      const unidadesBreakEven = margemBrutaUnitaria > 0 ? Math.ceil(custoFixoTotal / margemBrutaUnitaria) : 0;
      
      return {
        categoria,
        precoMedio,
        custoUnitario,
        margemBrutaUnitaria: Math.round(margemBrutaUnitaria * 100) / 100,
        unidadesBreakEven,
        volumeSemanalAtual: data.volumeSemanal,
        faturamentoSemanal: data.faturamentoTotal
      };
    }).filter(item => item.margemBrutaUnitaria > 0);
  }, [faturamentoPrevisto, custoFixoTotal]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const generateChartData = (unidadesBreakEven: number, precoMedio: number, custoUnitario: number) => {
    const maxUnidades = Math.max(unidadesBreakEven * 1.5, 100);
    const step = Math.ceil(maxUnidades / 20);
    const data = [];
    
    for (let unidades = 0; unidades <= maxUnidades; unidades += step) {
      const receita = unidades * precoMedio;
      const custoVariavel = unidades * custoUnitario;
      const custoTotal = custoVariavel + custoFixoTotal;
      
      data.push({
        unidades,
        receita,
        custoTotal,
        lucro: receita - custoTotal
      });
    }
    
    return data;
  };

  if (breakEvenData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Break Even por Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Dados insuficientes para calcular break even por produto
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Break Even por Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {breakEvenData.map((produto) => (
              <Card key={produto.categoria} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{produto.categoria}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Preço Médio:</span>
                      <div className="font-semibold">{formatCurrency(produto.precoMedio)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Custo Unitário:</span>
                      <div className="font-semibold">{formatCurrency(produto.custoUnitario)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Margem Bruta Unit.:</span>
                      <div className="font-bold text-green-600">{formatCurrency(produto.margemBrutaUnitaria)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Volume Semanal:</span>
                      <div className="font-semibold">{produto.volumeSemanalAtual.toLocaleString()} un</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Break Even (Unidades):</span>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {produto.unidadesBreakEven.toLocaleString()} un
                      </Badge>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Unidades mensais necessárias para cobrir custos fixos
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Ver Gráfico
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Break Even - {produto.categoria}</DialogTitle>
                        </DialogHeader>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={generateChartData(produto.unidadesBreakEven, produto.precoMedio, produto.custoUnitario)}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="unidades" 
                                label={{ value: 'Unidades Vendidas', position: 'insideBottom', offset: -5 }}
                              />
                              <YAxis 
                                label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }}
                                tickFormatter={(value) => formatCurrency(value)}
                              />
                              <Tooltip 
                                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                                labelFormatter={(label) => `${label} unidades`}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="receita" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                name="Receita"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="custoTotal" 
                                stroke="#ef4444" 
                                strokeWidth={2}
                                name="Custo Total"
                              />
                              <ReferenceLine 
                                x={produto.unidadesBreakEven} 
                                stroke="#3b82f6" 
                                strokeDasharray="5 5"
                                label={{ value: "Break Even", position: "top" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-1">
                          <Calculator className="h-4 w-4" />
                          Ver Fórmula
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Fórmulas de Cálculo - {produto.categoria}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Margem Bruta Unitária</h4>
                            <p className="text-sm font-mono bg-background p-2 rounded">
                              Margem = Preço Médio - Custo Unitário
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(produto.precoMedio)} - {formatCurrency(produto.custoUnitario)} = {formatCurrency(produto.margemBrutaUnitaria)}
                            </p>
                          </div>
                          
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Break Even (Unidades)</h4>
                            <p className="text-sm font-mono bg-background p-2 rounded">
                              Unidades = Custo Fixo Total ÷ Margem Bruta Unitária
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {formatCurrency(custoFixoTotal)} ÷ {formatCurrency(produto.margemBrutaUnitaria)} = {produto.unidadesBreakEven.toLocaleString()} unidades
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
            Cálculo realizado com base em margens brutas unitárias e custos fixos mensais
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
