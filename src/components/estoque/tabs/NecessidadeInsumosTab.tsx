
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Calculator, 
  Download, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  ChevronDown,
  ChevronRight,
  Calendar,
  Archive,
  ChefHat,
  List,
  BarChart3,
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { useNecessidadeInsumos } from "@/hooks/useNecessidadeInsumos";
import { useAuditoriaPCPData } from "@/hooks/useAuditoriaPCPData";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";

export default function NecessidadeInsumosTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [filtroInsumo, setFiltroInsumo] = useState("");
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [etapasAbertas, setEtapasAbertas] = useState<Record<number, boolean>>({});

  const { 
    necessidadeInsumos, 
    resumoCalculo, 
    loading, 
    calcularNecessidadeInsumos 
  } = useNecessidadeInsumos();

  const { dadosAuditoria } = useAuditoriaPCPData();
  const { produtos } = useSupabaseProdutos();
  const { receitas } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();

  const handleCalcular = () => {
    calcularNecessidadeInsumos(dataInicio, dataFim);
    setMostrarDetalhes(true);
  };

  const toggleEtapa = (etapa: number) => {
    setEtapasAbertas(prev => ({
      ...prev,
      [etapa]: !prev[etapa]
    }));
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

  // Calcular dados para as etapas
  const calcularDadosEtapas = () => {
    if (!dadosAuditoria || dadosAuditoria.length === 0) return null;

    // Etapa 1: Agendamentos
    const quantidadesPorProduto = new Map<string, number>();
    dadosAuditoria.forEach(agendamento => {
      Object.entries(agendamento.quantidadesPorProduto).forEach(([nomeProduto, quantidade]) => {
        if (quantidade > 0) {
          const atual = quantidadesPorProduto.get(nomeProduto) || 0;
          quantidadesPorProduto.set(nomeProduto, atual + quantidade);
        }
      });
    });

    // Etapa 2: Necessidade de produção (subtraindo estoque)
    const necessidadeProducao = new Map<string, { necessaria: number, estoque: number, producao: number }>();
    quantidadesPorProduto.forEach((quantidadeNecessaria, nomeProduto) => {
      const produto = produtos.find(p => p.nome === nomeProduto);
      const estoqueAtual = produto?.estoque_atual || 0;
      const necessidade = Math.max(0, quantidadeNecessaria - estoqueAtual);
      
      necessidadeProducao.set(nomeProduto, {
        necessaria: quantidadeNecessaria,
        estoque: estoqueAtual,
        producao: necessidade
      });
    });

    // Etapa 3: Receitas necessárias
    const receitasNecessarias = new Map<string, { producao: number, receitas: number, receita?: any }>();
    necessidadeProducao.forEach((data, nomeProduto) => {
      if (data.producao > 0) {
        const receita = receitas.find(r => r.nome === nomeProduto);
        if (receita) {
          const numeroReceitas = Math.ceil(data.producao / receita.rendimento);
          receitasNecessarias.set(nomeProduto, {
            producao: data.producao,
            receitas: numeroReceitas,
            receita
          });
        }
      }
    });

    // Etapa 4: Insumos por receita
    const insumosPorReceita = new Map<string, Map<string, { quantidade: number, unidade: string }>>();
    receitasNecessarias.forEach((data, nomeProduto) => {
      if (data.receita) {
        const insumosReceita = new Map<string, { quantidade: number, unidade: string }>();
        data.receita.itens.forEach((item: any) => {
          const quantidadeItem = item.quantidade * data.receitas;
          const insumo = insumos.find(i => i.id === item.insumo_id);
          if (insumo) {
            insumosReceita.set(item.insumo_id, {
              quantidade: quantidadeItem,
              unidade: insumo.unidade_medida
            });
          }
        });
        insumosPorReceita.set(nomeProduto, insumosReceita);
      }
    });

    // Etapa 5: Consolidação total
    const consolidacaoInsumos = new Map<string, { nome: string, quantidade: number, unidade: string }>();
    insumosPorReceita.forEach((insumosReceita) => {
      insumosReceita.forEach((data, insumoId) => {
        const atual = consolidacaoInsumos.get(insumoId) || { nome: '', quantidade: 0, unidade: '' };
        const insumo = insumos.find(i => i.id === insumoId);
        if (insumo) {
          atual.nome = insumo.nome;
          atual.unidade = insumo.unidade_medida;
          atual.quantidade += data.quantidade;
          consolidacaoInsumos.set(insumoId, atual);
        }
      });
    });

    return {
      agendamentos: Object.fromEntries(quantidadesPorProduto),
      necessidadeProducao: Object.fromEntries(necessidadeProducao),
      receitasNecessarias: Object.fromEntries(receitasNecessarias),
      insumosPorReceita: Object.fromEntries(
        Array.from(insumosPorReceita.entries()).map(([produto, insumos]) => [
          produto,
          Object.fromEntries(insumos)
        ])
      ),
      consolidacaoInsumos: Object.fromEntries(consolidacaoInsumos)
    };
  };

  const dadosEtapas = calcularDadosEtapas();

  const insumosFiltrados = necessidadeInsumos.filter(item =>
    !filtroInsumo || 
    item.nomeInsumo.toLowerCase().includes(filtroInsumo.toLowerCase())
  );

  const insumosParaComprar = insumosFiltrados.filter(item => item.quantidadeComprar > 0);

  const etapas = [
    {
      numero: 1,
      titulo: "Leitura dos Agendamentos",
      origem: "PCP > Auditoria PCP",
      icone: Calendar,
      concluida: !!dadosEtapas?.agendamentos
    },
    {
      numero: 2,
      titulo: "Subtração do Estoque de Produtos",
      origem: "Estoque > Produtos",
      icone: Archive,
      concluida: !!dadosEtapas?.necessidadeProducao
    },
    {
      numero: 3,
      titulo: "Cálculo das Receitas Necessárias",
      origem: "Precificação > Receitas",
      icone: ChefHat,
      concluida: !!dadosEtapas?.receitasNecessarias
    },
    {
      numero: 4,
      titulo: "Insumos por Receita",
      origem: "Receitas x Insumos",
      icone: List,
      concluida: !!dadosEtapas?.insumosPorReceita
    },
    {
      numero: 5,
      titulo: "Consolidação Total de Insumos",
      origem: "Soma de todos os insumos",
      icone: BarChart3,
      concluida: !!dadosEtapas?.consolidacaoInsumos
    },
    {
      numero: 6,
      titulo: "Subtração do Estoque de Insumos",
      origem: "Estoque > Insumos",
      icone: Package,
      concluida: necessidadeInsumos.length > 0
    }
  ];

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

              {necessidadeInsumos.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                  className="flex items-center gap-2"
                >
                  {mostrarDetalhes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {mostrarDetalhes ? 'Ocultar Etapas' : 'Ver Etapas'}
                </Button>
              )}
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

      {/* Painel de Etapas Detalhadas */}
      {mostrarDetalhes && necessidadeInsumos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Etapas do Cálculo
            </CardTitle>
            <CardDescription>
              Acompanhe o passo a passo do cálculo de necessidade de insumos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {etapas.map((etapa) => {
              const IconeEtapa = etapa.icone;
              return (
                <Collapsible 
                  key={etapa.numero}
                  open={etapasAbertas[etapa.numero]}
                  onOpenChange={() => toggleEtapa(etapa.numero)}
                >
                  <CollapsibleTrigger asChild>
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              etapa.concluida ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {etapa.concluida ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <span className="text-sm font-medium">{etapa.numero}</span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium">{etapa.titulo}</h4>
                              <p className="text-sm text-muted-foreground">Origem: {etapa.origem}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <IconeEtapa className="h-4 w-4 text-muted-foreground" />
                            {etapasAbertas[etapa.numero] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <Card className="ml-11 mt-2">
                      <CardContent className="pt-4">
                        {etapa.numero === 1 && dadosEtapas?.agendamentos && (
                          <div>
                            <h5 className="font-medium mb-3">Agendamentos do Período</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Object.entries(dadosEtapas.agendamentos).map(([produto, quantidade]) => (
                                <div key={produto} className="flex justify-between p-2 bg-blue-50 rounded">
                                  <span className="text-sm">{produto}</span>
                                  <Badge variant="secondary">{quantidade} un</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {etapa.numero === 2 && dadosEtapas?.necessidadeProducao && (
                          <div>
                            <h5 className="font-medium mb-3">Necessidade de Produção</h5>
                            <div className="space-y-2">
                              {Object.entries(dadosEtapas.necessidadeProducao).map(([produto, dados]) => (
                                <div key={produto} className="p-3 border rounded-lg">
                                  <div className="font-medium">{produto}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Necessário: {dados.necessaria} - Estoque: {dados.estoque} = 
                                    <span className="font-medium text-foreground"> {dados.producao} a produzir</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {etapa.numero === 3 && dadosEtapas?.receitasNecessarias && (
                          <div>
                            <h5 className="font-medium mb-3">Receitas Necessárias</h5>
                            <div className="space-y-2">
                              {Object.entries(dadosEtapas.receitasNecessarias).map(([produto, dados]) => (
                                <div key={produto} className="p-3 border rounded-lg">
                                  <div className="font-medium">{produto}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {dados.producao} unidades ÷ {dados.receita?.rendimento || 40} = 
                                    <span className="font-medium text-foreground"> {dados.receitas} receitas</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {etapa.numero === 4 && dadosEtapas?.insumosPorReceita && (
                          <div>
                            <h5 className="font-medium mb-3">Insumos por Receita</h5>
                            <div className="space-y-3">
                              {Object.entries(dadosEtapas.insumosPorReceita).map(([produto, insumos]) => (
                                <div key={produto} className="p-3 border rounded-lg">
                                  <div className="font-medium mb-2">{produto}</div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {Object.entries(insumos).map(([insumoId, dados]) => {
                                      const insumo = insumos.find(i => i.id === insumoId);
                                      return (
                                        <div key={insumoId} className="flex justify-between p-2 bg-gray-50 rounded text-sm">
                                          <span>{insumo?.nome || 'Insumo não encontrado'}</span>
                                          <span>{dados.quantidade.toFixed(2)} {dados.unidade}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {etapa.numero === 5 && dadosEtapas?.consolidacaoInsumos && (
                          <div>
                            <h5 className="font-medium mb-3">Consolidação Total</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {Object.entries(dadosEtapas.consolidacaoInsumos).map(([insumoId, dados]) => (
                                <div key={insumoId} className="flex justify-between p-2 bg-green-50 rounded">
                                  <span className="text-sm">{dados.nome}</span>
                                  <Badge variant="outline">{dados.quantidade.toFixed(2)} {dados.unidade}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {etapa.numero === 6 && necessidadeInsumos.length > 0 && (
                          <div>
                            <h5 className="font-medium mb-3">Resultado Final (Necessário - Estoque)</h5>
                            <div className="space-y-2">
                              {necessidadeInsumos.slice(0, 5).map((item) => (
                                <div key={item.insumoId} className="p-3 border rounded-lg">
                                  <div className="font-medium">{item.nomeInsumo}</div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    Necessário: {item.quantidadeNecessaria.toFixed(2)} - 
                                    Estoque: {item.estoqueAtual.toFixed(2)} = 
                                    <span className={`font-medium ${item.quantidadeComprar > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {item.quantidadeComprar > 0 ? ` ${item.quantidadeComprar.toFixed(2)} a comprar` : ' OK'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {necessidadeInsumos.length > 5 && (
                                <div className="text-center text-sm text-muted-foreground">
                                  ... e mais {necessidadeInsumos.length - 5} insumos
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}

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
