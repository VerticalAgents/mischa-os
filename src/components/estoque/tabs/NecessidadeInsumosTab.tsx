
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calculator, Package, DollarSign, AlertTriangle, Download, FileText, CheckCircle } from "lucide-react";
import { useNecessidadeInsumos } from "@/hooks/useNecessidadeInsumos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export default function NecessidadeInsumosTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  
  const {
    necessidadeInsumos,
    resumoCalculo,
    loading,
    calcularNecessidadeInsumos,
    dadosAuditoria
  } = useNecessidadeInsumos();

  const handleCalcular = async () => {
    if (!dataInicio || !dataFim) {
      toast({
        title: "Erro",
        description: "Por favor, selecione as datas de início e fim",
        variant: "destructive"
      });
      return;
    }

    if (new Date(dataInicio) > new Date(dataFim)) {
      toast({
        title: "Erro", 
        description: "A data de início deve ser anterior à data de fim",
        variant: "destructive"
      });
      return;
    }

    await calcularNecessidadeInsumos(dataInicio, dataFim);
    
    toast({
      title: "Cálculo concluído",
      description: `Necessidade de ${necessidadeInsumos.length} insumos calculada com sucesso`
    });
  };

  const exportarExcel = () => {
    if (!necessidadeInsumos.length) {
      toast({
        title: "Nenhum dado para exportar",
        description: "Execute o cálculo primeiro",
        variant: "destructive"
      });
      return;
    }

    const dadosExport = necessidadeInsumos.map(item => ({
      'Insumo': item.nomeInsumo,
      'Unidade': item.unidadeMedida,
      'Quantidade Necessária': item.quantidadeNecessaria,
      'Estoque Atual': item.estoqueAtual,
      'Quantidade a Comprar': item.quantidadeComprar,
      'Custo Médio': item.custoMedio,
      'Custo Total': item.custoTotal
    }));

    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Necessidade Insumos");

    const nomeArquivo = `necessidade_insumos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);

    toast({
      title: "Exportação concluída",
      description: `Arquivo ${nomeArquivo} baixado com sucesso`
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <Button 
              onClick={handleCalcular} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Cálculo */}
      {resumoCalculo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                  <p className="text-2xl font-semibold">{resumoCalculo.totalSabores}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-2xl font-semibold">{resumoCalculo.totalReceitas}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Insumos</p>
                  <p className="text-2xl font-semibold">{resumoCalculo.totalInsumos}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Investimento</p>
                  <p className="text-lg font-semibold">{formatCurrency(resumoCalculo.valorTotalCompra)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Processo de Cálculo */}
      {resumoCalculo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Cálculo das Receitas Necessárias
              <Badge variant="outline" className="text-green-600 border-green-200">
                Usando rendimentos reais da tabela
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>✅ <strong>Etapa 1:</strong> Consolidação de produtos por período - {resumoCalculo.totalSabores} produtos identificados</p>
              <p>✅ <strong>Etapa 2:</strong> Subtração do estoque atual dos produtos</p>
              <p>✅ <strong>Etapa 3:</strong> Identificação de receitas vinculadas aos produtos (tabela rendimentos_receita_produto)</p>
              <p>✅ <strong>Etapa 4:</strong> Cálculo de receitas usando rendimentos reais: Quantidade ÷ Rendimento = Receitas (arredondado para cima)</p>
              <p>✅ <strong>Etapa 5:</strong> Aplicação das receitas aos insumos - {resumoCalculo.totalReceitas} receitas calculadas</p>
              <p>✅ <strong>Etapa 6:</strong> Subtração do estoque atual de insumos - {resumoCalculo.totalInsumos} insumos necessários</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Resultados */}
      {necessidadeInsumos.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Compras</CardTitle>
            <Button 
              onClick={exportarExcel} 
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-96 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead className="text-right">Qtd Necessária</TableHead>
                    <TableHead className="text-right">Estoque Atual</TableHead>
                    <TableHead className="text-right">Qtd a Comprar</TableHead>
                    <TableHead className="text-right">Custo Médio</TableHead>
                    <TableHead className="text-right">Custo Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {necessidadeInsumos.map((item) => (
                    <TableRow key={item.insumoId}>
                      <TableCell className="font-medium">{item.nomeInsumo}</TableCell>
                      <TableCell>{item.unidadeMedida}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.quantidadeNecessaria)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.estoqueAtual)}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.quantidadeComprar > 0 ? "font-semibold text-orange-600" : "text-muted-foreground"}>
                          {formatNumber(item.quantidadeComprar)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.custoMedio)}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.custoTotal > 0 ? "font-semibold" : "text-muted-foreground"}>
                          {formatCurrency(item.custoTotal)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio */}
      {!loading && necessidadeInsumos.length === 0 && !resumoCalculo && (
        <Card>
          <CardContent className="text-center py-12">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cálculo de Necessidade de Insumos</h3>
            <p className="text-muted-foreground mb-4">
              Selecione um período e clique em "Calcular" para gerar a lista de compras
            </p>
            <p className="text-sm text-muted-foreground">
              O sistema utiliza os rendimentos reais cadastrados na página de Rendimentos para cálculos precisos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
