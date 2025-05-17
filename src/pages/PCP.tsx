
import { useState, useEffect } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight, FileSpreadsheet, ArrowUpDown, RefreshCw } from "lucide-react";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PCP() {
  const { sabores } = useSaborStore();
  const { getPedidosFiltrados, pedidos } = usePedidoStore();
  const { 
    setPeriodo, 
    calcularPlanejamento, 
    getPlanejamento, 
    getTotalFormasNecessarias, 
    getTotalUnidadesAgendadas,
    getTotalLotesNecessarios,
    setCapacidadeForma,
    capacidadeForma,
    setFormasPorLote,
    formasPorLote,
    setIncluirPedidosPrevistos,
    incluirPedidosPrevistos,
  } = usePlanejamentoProducaoStore();

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mostrarPedidosPrevistos, setMostrarPedidosPrevistos] = useState(incluirPedidosPrevistos);
  const [estoqueAtual, setEstoqueAtual] = useState<Record<number, number>>({});
  const [activeTab, setActiveTab] = useState("planejamento");
  
  // Define o início e fim da semana para o planejamento
  const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Segunda-feira
  const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Domingo

  // Effect to sync checkbox with store
  useEffect(() => {
    setIncluirPedidosPrevistos(mostrarPedidosPrevistos);
  }, [mostrarPedidosPrevistos, setIncluirPedidosPrevistos]);

  // Load initial flavor stock
  useEffect(() => {
    const estoqueInicial: Record<number, number> = {};
    sabores.forEach(sabor => {
      estoqueInicial[sabor.id] = sabor.saldoAtual;
    });
    setEstoqueAtual(estoqueInicial);
  }, [sabores]);

  // Calcula o planejamento a partir dos pedidos no período
  const calcularPlanejamentoProducao = () => {
    setPeriodo(inicioSemana, fimSemana);
    const todosPedidos = getPedidosFiltrados()
      .filter(pedido => 
        (pedido.statusPedido === "Agendado" || 
        pedido.statusPedido === "Em Separação" || 
        pedido.statusPedido === "Despachado") &&
        !pedido.dataEfetivaEntrega
      );
    
    calcularPlanejamento(todosPedidos, sabores);
  };

  // Avançar uma semana no calendário
  const avancarSemana = () => {
    setDataSelecionada(prevDate => addDays(prevDate, 7));
  };

  // Voltar uma semana no calendário
  const voltarSemana = () => {
    setDataSelecionada(prevDate => subDays(prevDate, 7));
  };

  // Atualiza a capacidade da forma quando o número muda
  const atualizarCapacidadeForma = (capacidade: number) => {
    setCapacidadeForma(capacidade);
    calcularPlanejamentoProducao();
  };

  // Atualiza o número de formas por lote
  const atualizarFormasPorLote = (formas: number) => {
    setFormasPorLote(formas);
  };

  // Atualiza o estoque atual de um sabor
  const atualizarEstoqueAtual = (idSabor: number, quantidade: number) => {
    setEstoqueAtual(prev => ({
      ...prev,
      [idSabor]: quantidade
    }));
  };

  // Buscar pedidos no período selecionado
  const pedidosNoPeriodo = pedidos.filter(pedido => {
    const dataPedido = new Date(pedido.dataPrevistaEntrega);
    return (
      (pedido.statusPedido === "Agendado" || 
       pedido.statusPedido === "Em Separação" || 
       pedido.statusPedido === "Despachado") &&
      !pedido.dataEfetivaEntrega &&
      dataPedido >= inicioSemana &&
      dataPedido <= fimSemana
    );
  });

  // Preparar dados para o planejamento com sobras/déficits
  const planejamentoComSobras = getPlanejamento().map(item => {
    const estoque = estoqueAtual[item.idSabor] || 0;
    const diferenca = estoque - item.totalUnidadesAgendadas;
    
    return {
      ...item,
      estoqueAtual: estoque,
      saldo: diferenca,
      status: diferenca >= 0 ? 'Sobra' : 'Déficit'
    };
  });

  // Agrupar sabores ativos e inativos
  const saboresAtivos = planejamentoComSobras.filter(item => item.totalUnidadesAgendadas > 0);
  const saboresInativos = sabores.filter(sabor => 
    !planejamentoComSobras.some(item => item.idSabor === sabor.id) && 
    sabor.saldoAtual === 0
  ).map(sabor => ({
    idSabor: sabor.id,
    nomeSabor: sabor.nome,
    totalUnidadesAgendadas: 0,
    formasNecessarias: 0,
    estoqueAtual: estoqueAtual[sabor.id] || 0,
    saldo: estoqueAtual[sabor.id] || 0,
    status: 'Inativo'
  }));

  // Mock data for retrospective (last 30 days)
  const retrospectiva = [
    { idSabor: 1, nomeSabor: 'Tradicional', totalUnidades: 2800, formasNecessarias: 93, percentualTotal: 38.5, crescimento: 5.2 },
    { idSabor: 2, nomeSabor: 'Choco Duo', totalUnidades: 1950, formasNecessarias: 65, percentualTotal: 26.8, crescimento: 3.1 },
    { idSabor: 5, nomeSabor: 'Avelã', totalUnidades: 1250, formasNecessarias: 42, percentualTotal: 17.2, crescimento: -2.5 },
    { idSabor: 3, nomeSabor: 'Mesclado', totalUnidades: 850, formasNecessarias: 28, percentualTotal: 11.7, crescimento: 8.7 },
    { idSabor: 4, nomeSabor: 'Surpresa', totalUnidades: 420, formasNecessarias: 14, percentualTotal: 5.8, crescimento: 1.2 }
  ];

  // Mock data for daily needs
  const necessidadeDiaria = [
    { 
      data: new Date(), 
      diaSemana: 'Seg', 
      totalUnidades: 520, 
      formasNecessarias: 18,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 220 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 150 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 70 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 80 }
      ]
    },
    { 
      data: new Date(new Date().setDate(new Date().getDate() + 1)), 
      diaSemana: 'Ter', 
      totalUnidades: 480, 
      formasNecessarias: 16,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 200 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 130 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 50 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 100 }
      ]
    },
    { 
      data: new Date(new Date().setDate(new Date().getDate() + 2)), 
      diaSemana: 'Qua', 
      totalUnidades: 490, 
      formasNecessarias: 17,
      saboresArray: [
        { idSabor: 1, nomeSabor: 'Tradicional', quantidade: 210 },
        { idSabor: 2, nomeSabor: 'Choco Duo', quantidade: 130 },
        { idSabor: 3, nomeSabor: 'Mesclado', quantidade: 60 },
        { idSabor: 5, nomeSabor: 'Avelã', quantidade: 90 }
      ]
    }
  ];

  // Exportar planejamento (mockup)
  const exportarPlanejamento = () => {
    alert("Funcionalidade de exportação será implementada em breve");
  };

  return (
    <div className="container mx-auto py-6">
      <PageHeader 
        title="Planejamento e Controle de Produção (PCP)" 
        description="Planejamento de produção baseado nos pedidos agendados e previstos"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={voltarSemana}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Semana Anterior
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[240px] justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                {format(inicioSemana, "dd/MM")} - {format(fimSemana, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Semana selecionada</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(inicioSemana, "dd 'de' MMMM", { locale: ptBR })} - 
                    {format(fimSemana, " dd 'de' MMMM, yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={avancarSemana}>
            Próxima Semana
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Button onClick={calcularPlanejamentoProducao}>
            Calcular Produção
          </Button>
          <Button variant="outline" onClick={exportarPlanejamento}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="planejamento">Planejamento</TabsTrigger>
          <TabsTrigger value="necessidade-diaria">Necessidade Diária</TabsTrigger>
          <TabsTrigger value="retrospectiva">Retrospectiva 30 Dias</TabsTrigger>
        </TabsList>
      
        <TabsContent value="planejamento" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Configurações do PCP */}
            <Card>
              <CardHeader>
                <CardTitle>Parâmetros de Produção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unidades por forma:</label>
                    <Input 
                      type="number" 
                      value={capacidadeForma} 
                      onChange={(e) => atualizarCapacidadeForma(parseInt(e.target.value) || 30)} 
                      min="1"
                      max="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formas por lote:</label>
                    <Input 
                      type="number" 
                      value={formasPorLote} 
                      onChange={(e) => atualizarFormasPorLote(parseInt(e.target.value) || 10)} 
                      min="1"
                      max="20"
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="mostrarPedidosPrevistos"
                      checked={mostrarPedidosPrevistos}
                      onCheckedChange={setMostrarPedidosPrevistos}
                    />
                    <label htmlFor="mostrarPedidosPrevistos" className="text-sm">
                      Incluir pedidos previstos (50%)
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo da produção */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo da Produção</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium block text-muted-foreground">Total de unidades:</span>
                    <span className="text-2xl font-semibold">{getTotalUnidadesAgendadas()}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium block text-muted-foreground">Total de formas:</span>
                    <span className="text-2xl font-semibold">{getTotalFormasNecessarias()}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium block text-muted-foreground">Lotes necessários:</span>
                    <span className="text-2xl font-semibold">{getTotalLotesNecessarios()}</span>
                  </div>
                  <Alert className="mt-4">
                    <AlertTitle>Próxima produção</AlertTitle>
                    <AlertDescription>
                      Você precisa agendar {getTotalLotesNecessarios()} {getTotalLotesNecessarios() === 1 ? 'lote' : 'lotes'} de produção para atender a demanda semanal.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Pedidos no período */}
            <Card>
              <CardHeader>
                <CardTitle>Pedidos no Período</CardTitle>
              </CardHeader>
              <CardContent>
                {pedidosNoPeriodo.length > 0 ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto">
                    {pedidosNoPeriodo.map(pedido => (
                      <div key={pedido.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium">{pedido.cliente?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(pedido.dataPrevistaEntrega), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant={pedido.statusPedido === "Agendado" ? "outline" : "default"}>
                            {pedido.statusPedido}
                          </Badge>
                          <span className="text-sm font-medium mt-1">
                            {pedido.totalPedidoUnidades} un.
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum pedido no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Planejamento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Planejamento por Sabor</CardTitle>
                <CardDescription>
                  Sabores ativos e com produção planejada
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="h-8">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar Estoque
                </Button>
                <Select value="all" onValueChange={() => {}}>
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os sabores</SelectItem>
                    <SelectItem value="active">Sabores ativos</SelectItem>
                    <SelectItem value="surplus">Com sobra</SelectItem>
                    <SelectItem value="deficit">Com déficit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sabor</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Formas</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Sobra/Déficit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saboresAtivos.length > 0 ? (
                    saboresAtivos.map(item => (
                      <TableRow key={item.idSabor}>
                        <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                        <TableCell className="text-right">{item.totalUnidadesAgendadas}</TableCell>
                        <TableCell className="text-right">{item.formasNecessarias}</TableCell>
                        <TableCell className="text-right">
                          {Math.round((item.totalUnidadesAgendadas / getTotalUnidadesAgendadas()) * 100)}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            value={estoqueAtual[item.idSabor] || 0}
                            onChange={(e) => atualizarEstoqueAtual(item.idSabor, parseInt(e.target.value) || 0)}
                            className="w-20 h-8 text-right ml-auto"
                          />
                        </TableCell>
                        <TableCell className={`text-right font-medium ${item.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.saldo > 0 ? '+' : ''}{item.saldo}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        Clique em "Calcular Produção" para ver o planejamento
                      </TableCell>
                    </TableRow>
                  )}
                  {saboresAtivos.length > 0 && (
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right">{getTotalUnidadesAgendadas()}</TableCell>
                      <TableCell className="text-right">{getTotalFormasNecessarias()}</TableCell>
                      <TableCell className="text-right">100%</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {saboresInativos.length > 0 && (
                <>
                  <h3 className="font-medium text-sm mt-8 mb-2">Sabores inativos (sem produção nos últimos 30 dias)</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sabor</TableHead>
                        <TableHead className="text-right">Estoque</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saboresInativos.map(item => (
                        <TableRow key={item.idSabor}>
                          <TableCell className="font-medium text-muted-foreground">{item.nomeSabor}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              value={estoqueAtual[item.idSabor] || 0}
                              onChange={(e) => atualizarEstoqueAtual(item.idSabor, parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right ml-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">Inativo</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="necessidade-diaria" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Necessidade Diária por Data</CardTitle>
                <CardDescription>
                  Distribuição de unidades por dia e sabor
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="contabilizarPrevisao"
                    checked={mostrarPedidosPrevistos}
                    onCheckedChange={setMostrarPedidosPrevistos}
                  />
                  <label htmlFor="contabilizarPrevisao" className="text-sm">
                    Contabilizar previsão
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Formas</TableHead>
                      {sabores.filter(s => s.ativo).map(sabor => (
                        <TableHead key={sabor.id} className="text-right">{sabor.nome.substring(0, 1)}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {necessidadeDiaria.map((dia, index) => (
                      <TableRow key={index} className={isToday(dia.data) ? 'bg-primary/10' : ''}>
                        <TableCell>{format(dia.data, "dd/MM")}</TableCell>
                        <TableCell>{dia.diaSemana}</TableCell>
                        <TableCell className="text-right font-medium">{dia.totalUnidades}</TableCell>
                        <TableCell className="text-right">{dia.formasNecessarias}</TableCell>
                        {sabores.filter(s => s.ativo).map(sabor => {
                          const saborDia = dia.saboresArray.find(s => s.idSabor === sabor.id);
                          return (
                            <TableCell key={sabor.id} className="text-right">
                              {saborDia ? saborDia.quantidade : 0}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell colSpan={2}>Total no período</TableCell>
                      <TableCell className="text-right">
                        {necessidadeDiaria.reduce((sum, dia) => sum + dia.totalUnidades, 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {necessidadeDiaria.reduce((sum, dia) => sum + dia.formasNecessarias, 0)}
                      </TableCell>
                      {sabores.filter(s => s.ativo).map(sabor => (
                        <TableCell key={sabor.id} className="text-right">
                          {necessidadeDiaria.reduce((sum, dia) => {
                            const saborDia = dia.saboresArray.find(s => s.idSabor === sabor.id);
                            return sum + (saborDia ? saborDia.quantidade : 0);
                          }, 0)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="retrospectiva" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Retrospectiva dos Últimos 30 Dias</CardTitle>
                <CardDescription>
                  Produção histórica e variação percentual
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" className="h-8">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Ordenar
                </Button>
                <Select defaultValue="units" onValueChange={() => {}}>
                  <SelectTrigger className="h-8 w-[120px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="units">Unidades</SelectItem>
                    <SelectItem value="growth">Crescimento</SelectItem>
                    <SelectItem value="percentage">Percentual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sabor</TableHead>
                    <TableHead className="text-right">Unidades</TableHead>
                    <TableHead className="text-right">Formas</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                    <TableHead className="text-right">Crescimento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retrospectiva.map((item) => (
                    <TableRow key={item.idSabor}>
                      <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                      <TableCell className="text-right">{item.totalUnidades}</TableCell>
                      <TableCell className="text-right">{item.formasNecessarias}</TableCell>
                      <TableCell className="text-right">
                        {item.percentualTotal.toFixed(1)}%
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.crescimento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.crescimento > 0 ? '+' : ''}{item.crescimento.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {retrospectiva.reduce((sum, item) => sum + item.totalUnidades, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {retrospectiva.reduce((sum, item) => sum + item.formasNecessarias, 0)}
                    </TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell className="text-right">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
