
import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, Save, Download, FileSpreadsheet } from "lucide-react";
import { format, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuditoriaPCPData } from "@/hooks/useAuditoriaPCPData";
import { toast } from "sonner";

interface ProducaoAgendadaData {
  data: Date;
  produtosPorData: Record<string, number>;
}

export default function ProducaoAgendadaTab() {
  const [producaoAgendada, setProducaoAgendada] = useState<ProducaoAgendadaData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { produtosAtivos, loading, dadosCarregados } = useAuditoriaPCPData();

  // Gerar array de 15 dias a partir de hoje
  const proximosQuinzeDias = useMemo(() => 
    Array.from({ length: 15 }, (_, i) => addDays(new Date(), i)), []
  );

  // Inicializar dados de produção agendada
  useEffect(() => {
    if (dadosCarregados && produtosAtivos.length > 0) {
      const dadosIniciais: ProducaoAgendadaData[] = proximosQuinzeDias.map(data => {
        const produtosPorData: Record<string, number> = {};
        produtosAtivos.forEach(produto => {
          produtosPorData[produto.nome] = 0;
        });
        return { data, produtosPorData };
      });
      setProducaoAgendada(dadosIniciais);
    }
  }, [dadosCarregados, produtosAtivos, proximosQuinzeDias]);

  // Função para atualizar quantidade de produção
  const atualizarProducao = useCallback((dataIndex: number, nomeProduto: string, valor: string) => {
    const novoValor = parseInt(valor) || 0;
    setProducaoAgendada(prev => {
      const novosDados = [...prev];
      novosDados[dataIndex] = {
        ...novosDados[dataIndex],
        produtosPorData: {
          ...novosDados[dataIndex].produtosPorData,
          [nomeProduto]: novoValor
        }
      };
      return novosDados;
    });
    setHasChanges(true);
  }, []);

  // Função para salvar dados
  const salvarDados = useCallback(() => {
    // Aqui você salvaria os dados no backend/localStorage
    console.log('Salvando dados de produção agendada:', producaoAgendada);
    toast.success('Produção agendada salva com sucesso!');
    setHasChanges(false);
  }, [producaoAgendada]);

  // Função para exportar CSV
  const exportarCSV = useCallback(() => {
    if (producaoAgendada.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const headers = [
      'Data',
      'Dia da Semana',
      ...produtosAtivos.map(p => p.nome)
    ];

    const linhas = producaoAgendada.map(item => [
      format(item.data, 'dd/MM/yyyy'),
      format(item.data, 'EEEE', { locale: ptBR }),
      ...produtosAtivos.map(produto => item.produtosPorData[produto.nome] || 0)
    ]);

    const csvContent = [
      headers.join(','),
      ...linhas.map(linha => linha.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `producao-agendada-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados para CSV!');
  }, [producaoAgendada, produtosAtivos]);

  const totalPorProduto = useCallback((nomeProduto: string) => {
    return producaoAgendada.reduce((sum, dia) => sum + (dia.produtosPorData[nomeProduto] || 0), 0);
  }, [producaoAgendada]);

  // Agrupar produtos por categoria
  const produtosPorCategoria = useMemo(() => {
    return produtosAtivos.reduce((acc, produto) => {
      if (!acc[produto.categoria]) {
        acc[produto.categoria] = [];
      }
      acc[produto.categoria].push(produto);
      return acc;
    }, {} as Record<string, typeof produtosAtivos>);
  }, [produtosAtivos]);

  const categoriasOrdenadas = useMemo(() => 
    Object.keys(produtosPorCategoria).sort(), [produtosPorCategoria]
  );

  if (!dadosCarregados || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg">Carregando sistema de produção agendada...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Produção Agendada (15 dias)
          </CardTitle>
          <CardDescription>
            Planeje a produção por produto nos próximos 15 dias. Digite o número de formas a serem produzidas em cada célula.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={salvarDados}
                disabled={!hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Produção
              </Button>
              <Button
                variant="outline"
                onClick={exportarCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Produtos ativos: {produtosAtivos.length} | {hasChanges ? 'Alterações não salvas' : 'Dados salvos'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabelas separadas por categoria */}
      {categoriasOrdenadas.map(categoria => (
        <Card key={categoria}>
          <CardHeader>
            <CardTitle>{categoria}</CardTitle>
            <CardDescription>
              Programação de produção para produtos da categoria {categoria}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky left-0 bg-background min-w-[150px] z-10 border-r">
                            Produto
                          </TableHead>
                          {proximosQuinzeDias.map((data, index) => (
                            <TableHead key={index} className="text-center min-w-[80px] px-2">
                              <div className="text-xs">
                                <div>{format(data, 'dd/MM')}</div>
                                <div className="text-muted-foreground">
                                  {format(data, 'EEE', { locale: ptBR }).substring(0, 3)}
                                </div>
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-center font-medium min-w-[80px] border-l">
                            Total Formas
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtosPorCategoria[categoria].map(produto => (
                          <TableRow key={produto.nome}>
                            <TableCell className="sticky left-0 bg-background font-medium z-10 border-r">
                              {produto.nome}
                            </TableCell>
                            {producaoAgendada.map((dia, index) => {
                              const quantidade = dia.produtosPorData[produto.nome] || 0;
                              const isHoje = isToday(dia.data);
                              
                              return (
                                <Tooltip key={index}>
                                  <TooltipTrigger asChild>
                                    <TableCell 
                                      className={`text-center px-1 ${isHoje ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                                    >
                                      <Input
                                        type="number"
                                        min="0"
                                        value={quantidade || ''}
                                        onChange={(e) => atualizarProducao(index, produto.nome, e.target.value)}
                                        className="w-16 h-8 text-center text-sm border-0 focus:border focus:border-primary"
                                        placeholder="0"
                                      />
                                    </TableCell>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="text-sm">
                                      <div className="font-medium">{format(dia.data, "dd 'de' MMMM", { locale: ptBR })}</div>
                                      <div>{produto.nome}: {quantidade} formas</div>
                                      {isHoje && <div className="text-blue-600 font-medium">📅 Hoje</div>}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                            <TableCell className="text-center font-bold bg-muted border-l">
                              {totalPorProduto(produto.nome)}
                            </TableCell>
                          </TableRow>
                        ))}
                        
                        {/* Linha de totais por dia para esta categoria */}
                        <TableRow className="bg-muted/50 font-medium border-t-2">
                          <TableCell className="sticky left-0 bg-muted/50 z-10 border-r">
                            Total {categoria}
                          </TableCell>
                          {producaoAgendada.map((dia, index) => {
                            const totalDia = produtosPorCategoria[categoria].reduce((sum, produto) => 
                              sum + (dia.produtosPorData[produto.nome] || 0), 0
                            );
                            return (
                              <TableCell 
                                key={index} 
                                className={`text-center px-2 ${isToday(dia.data) ? 'ring-2 ring-blue-500' : ''}`}
                              >
                                {totalDia}
                              </TableCell>
                            );
                          })}
                          <TableCell className="text-center font-bold border-l">
                            {produtosPorCategoria[categoria].reduce((sum, produto) => 
                              sum + totalPorProduto(produto.nome), 0
                            )}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Legenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
              <span>Hoje</span>
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" className="w-16 h-6" disabled />
              <span>Digite o número de formas a produzir</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Clique em "Salvar Produção" para confirmar as alterações<br/>
            Use "Exportar CSV" para baixar o planejamento de produção
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
