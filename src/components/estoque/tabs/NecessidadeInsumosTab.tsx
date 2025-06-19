
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, Download, ShoppingCart, Package, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useNecessidadeInsumos } from "@/hooks/useNecessidadeInsumos";

export default function NecessidadeInsumosTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [filtroInsumo, setFiltroInsumo] = useState("");

  const { 
    necessidadeInsumos, 
    resumoCalculo, 
    loading, 
    calcularNecessidadeInsumos 
  } = useNecessidadeInsumos();

  const handleCalcular = () => {
    calcularNecessidadeInsumos(dataInicio, dataFim);
  };

  const exportarCSV = () => {
    if (necessidadeInsumos.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'Insumo',
      'Unidade',
      'Quantidade Necessária',
      'Estoque Atual',
      'Quantidade a Comprar',
      'Custo Médio (R$)',
      'Custo Total (R$)'
    ];

    const linhas = necessidadeInsumos
      .filter(item => 
        !filtroInsumo || 
        item.nomeInsumo.toLowerCase().includes(filtroInsumo.toLowerCase())
      )
      .map(item => [
        `"${item.nomeInsumo}"`,
        item.unidadeMedida,
        item.quantidadeNecessaria.toFixed(2),
        item.estoqueAtual.toFixed(2),
        item.quantidadeComprar.toFixed(2),
        item.custoMedio.toFixed(2),
        item.custoTotal.toFixed(2)
      ]);

    const csvContent = [
      headers.join(','),
      ...linhas.map(linha => linha.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `necessidade-insumos-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const insumosFiltrados = necessidadeInsumos.filter(item =>
    !filtroInsumo || 
    item.nomeInsumo.toLowerCase().includes(filtroInsumo.toLowerCase())
  );

  const insumosParaComprar = insumosFiltrados.filter(item => item.quantidadeComprar > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Necessidade de Insumos
          </CardTitle>
          <CardDescription>
            Calcule a necessidade de compra de insumos com base nos agendamentos e estoques atuais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[150px]">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="min-w-[150px]">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="filtro-insumo">Filtrar Insumo</Label>
              <Input
                id="filtro-insumo"
                placeholder="Nome do insumo..."
                value={filtroInsumo}
                onChange={(e) => setFiltroInsumo(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleCalcular}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Calculator className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Calculando...' : 'Calcular'}
              </Button>
              
              <Button
                variant="outline"
                onClick={exportarCSV}
                disabled={loading || necessidadeInsumos.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {/* Resumo */}
          {resumoCalculo && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Package className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold text-blue-600">{resumoCalculo.totalSabores}</div>
                <div className="text-sm text-muted-foreground">Produtos</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Calculator className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold text-green-600">{resumoCalculo.totalReceitas}</div>
                <div className="text-sm text-muted-foreground">Receitas</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <ShoppingCart className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold text-orange-600">{insumosParaComprar.length}</div>
                <div className="text-sm text-muted-foreground">Insumos a Comprar</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  R$ {resumoCalculo.valorTotalCompra.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Resultados */}
      <Card>
        <CardHeader>
          <CardTitle>Necessidade de Compra</CardTitle>
          <CardDescription>
            Lista de insumos que precisam ser comprados para atender a demanda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-lg">Calculando necessidades...</p>
              </div>
            </div>
          ) : necessidadeInsumos.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum resultado encontrado. Clique em "Calcular" para processar os dados do período selecionado.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <Badge variant="secondary">
                  {insumosFiltrados.length} insumos encontrados
                </Badge>
                <Badge variant="outline">
                  {insumosParaComprar.length} precisam ser comprados
                </Badge>
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Necessário</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">A Comprar</TableHead>
                      <TableHead className="text-right">Custo Médio</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {insumosFiltrados.map((item) => (
                      <TableRow key={item.insumoId}>
                        <TableCell className="font-medium">{item.nomeInsumo}</TableCell>
                        <TableCell>{item.unidadeMedida}</TableCell>
                        <TableCell className="text-right">
                          {item.quantidadeNecessaria.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={item.estoqueAtual > 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.estoqueAtual.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantidadeComprar > 0 ? (
                            <Badge variant="destructive">
                              {item.quantidadeComprar.toFixed(2)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">0</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {item.custoMedio.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.custoTotal > 0 ? (
                            <span className="font-semibold text-red-600">
                              R$ {item.custoTotal.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">R$ 0,00</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
