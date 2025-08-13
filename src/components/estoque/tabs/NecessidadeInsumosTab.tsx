
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, ShoppingCart, Calendar, DollarSign, Package, Loader2, TrendingUp } from "lucide-react";
import { useNecessidadeInsumos } from "@/hooks/useNecessidadeInsumos";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProdutosIgnoradosAlert from "../ProdutosIgnoradosAlert";

export default function NecessidadeInsumosTab() {
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
    return format(inicioSemana, 'yyyy-MM-dd');
  });
  
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
    const fimSemana = addDays(inicioSemana, 6);
    return format(fimSemana, 'yyyy-MM-dd');
  });

  const { 
    necessidadeInsumos, 
    resumoCalculo, 
    loading, 
    calcularNecessidadeInsumos,
    produtosIgnorados,
    detalhesCalculo
  } = useNecessidadeInsumos();

  const handleCalcular = () => {
    if (dataInicio && dataFim) {
      calcularNecessidadeInsumos(dataInicio, dataFim);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período para Cálculo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={handleCalcular}
              disabled={loading || !dataInicio || !dataFim}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4" />
              )}
              Calcular Necessidade de Insumos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alertas sobre produtos ignorados */}
      {resumoCalculo && (
        <ProdutosIgnoradosAlert
          produtosIgnorados={produtosIgnorados}
          detalhesCalculo={detalhesCalculo}
          coberturaRendimentos={resumoCalculo.coberturaRendimentos}
        />
      )}

      {/* Resumo do Cálculo */}
      {resumoCalculo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                  <p className="text-lg font-semibold">{resumoCalculo.produtosProcessados}</p>
                  {resumoCalculo.produtosIgnorados > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {resumoCalculo.produtosIgnorados} ignorados
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-lg font-semibold">{resumoCalculo.totalReceitas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Insumos</p>
                  <p className="text-lg font-semibold">{resumoCalculo.totalInsumos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-lg font-semibold">{formatCurrency(resumoCalculo.valorTotalCompra)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Insumos */}
      {necessidadeInsumos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Lista de Compras - {formatDate(dataInicio)} a {formatDate(dataFim)}
              <Badge variant="secondary">{necessidadeInsumos.length} insumos</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {necessidadeInsumos.map((insumo, index) => (
                <div key={insumo.insumoId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{insumo.nomeInsumo}</span>
                      <Badge variant="outline">{insumo.unidadeMedida}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Necessário: <strong>{insumo.quantidadeNecessaria.toFixed(2)}</strong> • 
                      Estoque: <strong>{insumo.estoqueAtual.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {insumo.quantidadeComprar.toFixed(2)} {insumo.unidadeMedida}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(insumo.custoTotal)}
                    </div>
                  </div>
                </div>
              ))}
              
              {necessidadeInsumos.length > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center p-4 bg-muted/30 rounded-lg">
                    <span className="font-semibold">Total da Lista de Compras:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(resumoCalculo?.valorTotalCompra || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!resumoCalculo && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Calcule a Necessidade de Insumos</h3>
            <p className="text-muted-foreground mb-4">
              Selecione um período e clique em "Calcular" para gerar a lista de compras baseada nos agendamentos.
            </p>
            <p className="text-sm text-muted-foreground">
              O cálculo agora usa os <strong>rendimentos reais</strong> cadastrados na página de Rendimentos para maior precisão.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
