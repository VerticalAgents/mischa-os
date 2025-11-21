import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Calculator, FileSpreadsheet, Eye, EyeOff } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNecessidadeInsumos } from '@/hooks/useNecessidadeInsumos';
import { toast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as XLSX from 'xlsx';
import DebugReceitasNecessarias from './DebugReceitasNecessarias';
export default function NecessidadeInsumosTab() {
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [dataFim, setDataFim] = useState<Date>(addDays(new Date(), 7));
  const [mostrarEtapas, setMostrarEtapas] = useState(false);
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
        description: "Selecione as datas de início e fim",
        variant: "destructive"
      });
      return;
    }
    if (dataFim <= dataInicio) {
      toast({
        title: "Erro",
        description: "A data fim deve ser maior que a data início",
        variant: "destructive"
      });
      return;
    }
    await calcularNecessidadeInsumos(dataInicio.toISOString().split('T')[0], dataFim.toISOString().split('T')[0]);
    toast({
      title: "Cálculo realizado",
      description: "Necessidade de insumos calculada com sucesso"
    });
  };
  const exportarParaExcel = () => {
    if (!necessidadeInsumos || necessidadeInsumos.length === 0) {
      toast({
        title: "Erro",
        description: "Não há dados para exportar",
        variant: "destructive"
      });
      return;
    }
    const dadosExport = necessidadeInsumos.map(insumo => ({
      'Insumo': insumo.nomeInsumo,
      'Unidade': insumo.unidadeMedida,
      'Qtd Necessária': insumo.quantidadeNecessaria,
      'Estoque Atual': insumo.estoqueAtual,
      'Qtd a Comprar': insumo.quantidadeComprar,
      'Custo Médio': insumo.custoMedio.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }),
      'Custo Total': insumo.custoTotal.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    }));
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Necessidade Insumos');
    const fileName = `necessidade-insumos-${format(dataInicio, 'dd-MM-yyyy')}-${format(dataFim, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast({
      title: "Exportado com sucesso",
      description: `Arquivo ${fileName} foi gerado`
    });
  };

  // Calcular necessidade de produção para o debug
  const necessidadeProducao: Record<string, number> = {};
  if (dadosAuditoria && dadosAuditoria.length > 0) {
    const quantidadesPorProduto: Record<string, number> = {};
    dadosAuditoria.forEach(agendamento => {
      Object.entries(agendamento.quantidadesPorProduto).forEach(([produto, quantidade]) => {
        const qtd = Number(quantidade) || 0;
        if (qtd > 0) {
          quantidadesPorProduto[produto] = (quantidadesPorProduto[produto] || 0) + qtd;
        }
      });
    });

    // Simular subtração de estoque (seria melhor ter esses dados do hook)
    Object.entries(quantidadesPorProduto).forEach(([produto, quantidade]) => {
      // Para o debug, assumindo estoque zero para simplicidade
      if (quantidade > 0) {
        necessidadeProducao[produto] = quantidade;
      }
    });
  }
  return <div className="space-y-6">
      {/* Filtros de Data */}
      <Card>
        <CardHeader>
          <CardTitle>Período para Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", {
                    locale: ptBR
                  }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={date => date && setDataInicio(date)} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", {
                    locale: ptBR
                  }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={date => date && setDataFim(date)} locale={ptBR} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCalcular} disabled={loading} className="flex-1">
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? 'Calculando...' : 'Calcular'}
              </Button>
              
              {necessidadeInsumos.length > 0 && <Button variant="outline" onClick={exportarParaExcel}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exportar
                </Button>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      {resumoCalculo && <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{resumoCalculo.totalSabores}</div>
              <p className="text-xs text-muted-foreground">Produtos Diferentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{resumoCalculo.totalReceitas}</div>
              <p className="text-xs text-muted-foreground">Receitas Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{resumoCalculo.totalInsumos}</div>
              <p className="text-xs text-muted-foreground">Insumos Necessários</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {resumoCalculo.valorTotalCompra.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            })}
              </div>
              <p className="text-xs text-muted-foreground">Valor Total Compra</p>
            </CardContent>
          </Card>
        </div>}

      {/* Botão Ver Etapas */}
      {necessidadeInsumos.length > 0 && <Collapsible open={mostrarEtapas} onOpenChange={setMostrarEtapas}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full">
              {mostrarEtapas ? <><EyeOff className="w-4 h-4 mr-2" /> Ocultar Etapas</> : <><Eye className="w-4 h-4 mr-2" /> Ver Etapas</>}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Etapa 1: Agendamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">1</span>
                  Agendamentos do Período
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {dadosAuditoria?.length || 0} agendamentos encontrados para o período selecionado
                </div>
              </CardContent>
            </Card>

            {/* Etapa 2: Necessidade de Produção */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center">2</span>
                  Necessidade de Produção
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Total necessário menos estoque atual de produtos
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {Object.keys(necessidadeProducao).length} produtos precisam ser produzidos
                </div>
              </CardContent>
            </Card>

            {/* Etapa 3: Receitas Necessárias */}
            <DebugReceitasNecessarias necessidadeProducao={necessidadeProducao} />

            {/* Etapa 4: Lista de Insumos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center">4</span>
                  Lista de Insumos Necessários
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Insumos necessários menos estoque atual
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {necessidadeInsumos.length} insumos precisam ser comprados
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>}

      {/* Tabela de Resultados */}
      {necessidadeInsumos.length > 0 && <Card>
          <CardHeader>
            <CardTitle>Lista de Compras - Insumos Necessários</CardTitle>
          </CardHeader>
          <CardContent>
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
                {necessidadeInsumos.map(insumo => <TableRow key={insumo.insumoId}>
                    <TableCell className="font-medium">{insumo.nomeInsumo}</TableCell>
                    <TableCell>{insumo.unidadeMedida}</TableCell>
                    <TableCell className="text-right">
                      {insumo.quantidadeNecessaria.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {insumo.estoqueAtual.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={insumo.quantidadeComprar > 0 ? "destructive" : "secondary"}>
                        {insumo.quantidadeComprar.toLocaleString('pt-BR')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {insumo.custoMedio.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {insumo.custoTotal.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>}

      {/* Estado vazio */}
      {!loading && necessidadeInsumos.length === 0 && <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cálculo realizado</h3>
            <p className="text-muted-foreground text-left">
              Selecione um período e clique em "Calcular" para ver a necessidade de insumos
            </p>
          </CardContent>
        </Card>}
    </div>;
}