import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, Calendar, Filter, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, subYears, subDays, isWithinInterval, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useEntregasIndicadores } from "@/hooks/useEntregasIndicadores";

export default function DashboardEntregasAnalytics() {
  // Estados para controle de UI
  const [isRevendaDetailsOpen, setIsRevendaDetailsOpen] = useState(false);
  const [isFoodServiceDetailsOpen, setIsFoodServiceDetailsOpen] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("90");
  const [mostrarUnidades, setMostrarUnidades] = useState(false);
  
  // Dados das entregas
  const { registros: todasEntregas } = useHistoricoEntregasStore();
  
  // Filtrar apenas entregas (excluir devoluções)
  const entregas = useMemo(() => {
    return todasEntregas.filter(r => r.tipo === 'entrega');
  }, [todasEntregas]);
  
  // Função para categorizar produtos baseado no nome
  const categorizarProduto = (nomeProduto: string): 'revenda' | 'foodservice' => {
    const nome = nomeProduto.toLowerCase();
    
    // Produtos Food-Service: Mini e Nano (porções menores para serviço)
    if (nome.includes('mini') || nome.includes('nano')) {
      return 'foodservice';
    }
    
    // Produtos Revenda: Tamanho padrão (para revenda)
    return 'revenda';
  };
  
  // Datas de referência
  const hoje = new Date();
  const inicioMesAtual = startOfMonth(hoje);
  const fimMesAtual = endOfMonth(hoje);
  
  // Mês anterior para calcular variação
  const mesAnterior = subMonths(hoje, 1);
  const inicioMesAnterior = startOfMonth(mesAnterior);
  const fimMesAnterior = endOfMonth(mesAnterior);
  
  // Mesmo mês ano passado
  const mesmoMesAnoPassado = subYears(hoje, 1);
  const inicioMesmoMesAnoPassado = startOfMonth(mesmoMesAnoPassado);
  const fimMesmoMesAnoPassado = endOfMonth(mesmoMesAnoPassado);
  
  // Calcular entregas do mês atual
  const entregasMesAtual = useMemo(() => {
    const registrosMes = entregas.filter(r => {
      const dataEntrega = startOfDay(new Date(r.data));
      return isWithinInterval(dataEntrega, { start: inicioMesAtual, end: fimMesAtual });
    });
    
    let totalFormas = 0;
    let totalUnidades = 0;
    
    registrosMes.forEach(entrega => {
      totalFormas += entrega.quantidade || 0;
      
      if (entrega.itens && Array.isArray(entrega.itens)) {
        entrega.itens.forEach(item => {
          totalUnidades += item.quantidade_entregue || 0;
        });
      }
    });
    
    return { totalFormas, totalUnidades };
  }, [entregas, inicioMesAtual, fimMesAtual]);
  
  // Calcular entregas do mês anterior
  const entregasMesAnterior = useMemo(() => {
    const registrosMes = entregas.filter(r => {
      const dataEntrega = startOfDay(new Date(r.data));
      return isWithinInterval(dataEntrega, { start: inicioMesAnterior, end: fimMesAnterior });
    });
    
    let totalFormas = 0;
    let totalUnidades = 0;
    
    registrosMes.forEach(entrega => {
      totalFormas += entrega.quantidade || 0;
      
      if (entrega.itens && Array.isArray(entrega.itens)) {
        entrega.itens.forEach(item => {
          totalUnidades += item.quantidade_entregue || 0;
        });
      }
    });
    
    return { totalFormas, totalUnidades };
  }, [entregas, inicioMesAnterior, fimMesAnterior]);
  
  // Calcular entregas do mesmo mês ano passado
  const entregasMesmoMesAnoPassado = useMemo(() => {
    const registrosMes = entregas.filter(r => {
      const dataEntrega = startOfDay(new Date(r.data));
      return isWithinInterval(dataEntrega, { start: inicioMesmoMesAnoPassado, end: fimMesmoMesAnoPassado });
    });
    
    let totalFormas = 0;
    let totalUnidades = 0;
    
    registrosMes.forEach(entrega => {
      totalFormas += entrega.quantidade || 0;
      
      if (entrega.itens && Array.isArray(entrega.itens)) {
        entrega.itens.forEach(item => {
          totalUnidades += item.quantidade_entregue || 0;
        });
      }
    });
    
    return { totalFormas, totalUnidades };
  }, [entregas, inicioMesmoMesAnoPassado, fimMesmoMesAnoPassado]);
  
  // Cálculos de variação
  const variacaoMesAnterior = entregasMesAnterior.totalUnidades > 0 
    ? (entregasMesAtual.totalUnidades - entregasMesAnterior.totalUnidades) / entregasMesAnterior.totalUnidades * 100 
    : 0;
  const variacaoAnoAnterior = entregasMesmoMesAnoPassado.totalUnidades > 0 
    ? (entregasMesAtual.totalUnidades - entregasMesmoMesAnoPassado.totalUnidades) / entregasMesmoMesAnoPassado.totalUnidades * 100 
    : 0;
  
  // Período dinâmico baseado na seleção
  const diasPeriodo = parseInt(periodoSelecionado);
  const inicioPeriodo = subDays(hoje, diasPeriodo);
  
  // Texto do período para exibição
  const textoPeriodo = useMemo(() => {
    if (diasPeriodo >= 365) return "Último ano";
    return `Últimos ${diasPeriodo} dias`;
  }, [diasPeriodo]);
  
  // Entregas do período selecionado por categoria
  const entregasPeriodo = useMemo(() => {
    const registrosPeriodo = entregas.filter(r => {
      const dataEntrega = startOfDay(new Date(r.data));
      return isWithinInterval(dataEntrega, { start: inicioPeriodo, end: hoje });
    });
    
    // Agrupar por produto e categoria
    const produtosRevenda = new Map<string, { formas: number; unidades: number }>();
    const produtosFoodService = new Map<string, { formas: number; unidades: number }>();
    
    registrosPeriodo.forEach(entrega => {
      if (entrega.itens && Array.isArray(entrega.itens)) {
        entrega.itens.forEach(item => {
          const nomeProduto = item.produto_nome || 'Produto sem nome';
          const categoria = categorizarProduto(nomeProduto);
          const quantidade = item.quantidade_entregue || 0;
          
          // Estimar formas (aproximado)
          const formas = Math.ceil(quantidade / 12); // Assumindo 12 unidades por forma
          
          if (categoria === 'revenda') {
            const atual = produtosRevenda.get(nomeProduto) || { formas: 0, unidades: 0 };
            produtosRevenda.set(nomeProduto, {
              formas: atual.formas + formas,
              unidades: atual.unidades + quantidade
            });
          } else {
            const atual = produtosFoodService.get(nomeProduto) || { formas: 0, unidades: 0 };
            produtosFoodService.set(nomeProduto, {
              formas: atual.formas + formas,
              unidades: atual.unidades + quantidade
            });
          }
        });
      }
    });
    
    return { produtosRevenda, produtosFoodService };
  }, [entregas, inicioPeriodo, hoje]);
  
  // Calcular totais e produtos detalhados para Revenda
  const dadosRevenda = useMemo(() => {
    const { produtosRevenda } = entregasPeriodo;
    
    let totalFormas = 0;
    let totalUnidades = 0;
    
    const produtos: Array<{ nome: string; formas: number; unidades: number; percentual: number }> = [];
    
    produtosRevenda.forEach((dados, nome) => {
      totalFormas += dados.formas;
      totalUnidades += dados.unidades;
      produtos.push({
        nome,
        formas: dados.formas,
        unidades: dados.unidades,
        percentual: 0 // Será calculado depois
      });
    });
    
    // Calcular percentuais
    produtos.forEach(p => {
      p.percentual = totalFormas > 0 ? (p.formas / totalFormas) * 100 : 0;
    });
    
    // Ordenar por quantidade de formas
    produtos.sort((a, b) => b.formas - a.formas);
    
    return { totalFormas, totalUnidades, produtos };
  }, [entregasPeriodo]);
  
  // Calcular totais e produtos detalhados para Food-Service
  const dadosFoodService = useMemo(() => {
    const { produtosFoodService } = entregasPeriodo;
    
    let totalFormas = 0;
    let totalUnidades = 0;
    
    const produtos: Array<{ nome: string; formas: number; unidades: number; percentual: number }> = [];
    
    produtosFoodService.forEach((dados, nome) => {
      totalFormas += dados.formas;
      totalUnidades += dados.unidades;
      produtos.push({
        nome,
        formas: dados.formas,
        unidades: dados.unidades,
        percentual: 0 // Será calculado depois
      });
    });
    
    // Calcular percentuais
    produtos.forEach(p => {
      p.percentual = totalFormas > 0 ? (p.formas / totalFormas) * 100 : 0;
    });
    
    // Ordenar por quantidade de formas
    produtos.sort((a, b) => b.formas - a.formas);
    
    return { totalFormas, totalUnidades, produtos };
  }, [entregasPeriodo]);
  
  // Calcular quantos meses mostrar baseado no período selecionado
  const numeroMeses = useMemo(() => {
    const dias = parseInt(periodoSelecionado);
    if (dias <= 30) return 1;
    if (dias <= 60) return 2;
    if (dias <= 90) return 3;
    if (dias <= 180) return 6;
    return 12; // 365 dias = 1 ano
  }, [periodoSelecionado]);
  
  // Dados para o gráfico comparativo
  const dadosGraficoComparativo = useMemo(() => {
    // Gerar array com os meses baseado no período selecionado
    const meses: Date[] = [];
    for (let i = numeroMeses - 1; i >= 0; i--) {
      meses.push(startOfMonth(subMonths(hoje, i)));
    }

    const dados = meses.map(mesInicio => {
      const mesFim = endOfMonth(mesInicio);
      const mesLabel = format(mesInicio, "MMM/yy", { locale: ptBR });

      // Filtrar registros deste mês
      const registrosMes = entregas.filter(r => {
        const dataEntrega = startOfDay(new Date(r.data));
        return isWithinInterval(dataEntrega, { start: mesInicio, end: mesFim });
      });

      // Separar por categoria e somar formas e unidades
      let formasRevenda = 0;
      let formasFoodService = 0;
      let unidadesRevenda = 0;
      let unidadesFoodService = 0;

      registrosMes.forEach(entrega => {
        if (entrega.itens && Array.isArray(entrega.itens)) {
          entrega.itens.forEach(item => {
            const categoria = categorizarProduto(item.produto_nome || '');
            const quantidade = item.quantidade_entregue || 0;
            const formas = Math.ceil(quantidade / 12);
            
            if (categoria === 'revenda') {
              formasRevenda += formas;
              unidadesRevenda += quantidade;
            } else {
              formasFoodService += formas;
              unidadesFoodService += quantidade;
            }
          });
        }
      });

      return {
        mes: mesLabel,
        revenda: mostrarUnidades ? unidadesRevenda : formasRevenda,
        foodService: mostrarUnidades ? unidadesFoodService : formasFoodService
      };
    });

    return dados;
  }, [entregas, hoje, mostrarUnidades, numeroMeses]);
  
  // Usar hook de indicadores para métricas financeiras
  const dataInicio = format(inicioPeriodo, 'yyyy-MM-dd');
  const dataFim = format(hoje, 'yyyy-MM-dd');
  const { indicadores } = useEntregasIndicadores(dataInicio, dataFim);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Entregas Mês Atual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregas Mês Atual
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entregasMesAtual.totalUnidades.toLocaleString('pt-BR')} un
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {variacaoMesAnterior >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className={variacaoMesAnterior >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(variacaoMesAnterior).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Comparação Ano Anterior */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              vs {format(mesmoMesAnoPassado, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entregasMesmoMesAnoPassado.totalUnidades.toLocaleString('pt-BR')} un
            </div>
            <div className="flex items-center gap-1 text-xs mt-1">
              {variacaoAnoAnterior >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
              <span className={variacaoAnoAnterior >= 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(variacaoAnoAnterior).toFixed(1)}%
              </span>
              <span className="text-muted-foreground">de diferença</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription className="text-left">
            Selecione o período para análise por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="periodo-select" className="text-sm font-medium whitespace-nowrap">
              Período de análise:
            </Label>
            <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
              <SelectTrigger id="periodo-select" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos Últimos Dias - Por Categoria */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Entregas Revenda
                </CardTitle>
                <CardDescription className="text-left">
                  {textoPeriodo}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Geral */}
              <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Total Entregue</p>
                <p className="text-3xl font-bold text-primary">
                  {dadosRevenda.totalUnidades.toLocaleString('pt-BR')} un
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dadosRevenda.totalFormas.toLocaleString('pt-BR')} formas
                </p>
              </div>

              {/* Produtos Individuais - Collapsible */}
              {dadosRevenda.produtos.length > 0 && (
                <Collapsible open={isRevendaDetailsOpen} onOpenChange={setIsRevendaDetailsOpen}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isRevendaDetailsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-3">
                    {dadosRevenda.produtos.map((produto) => (
                      <div key={produto.nome} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{produto.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm px-2 py-0.5">
                              {produto.formas.toLocaleString('pt-BR')} formas
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              {produto.percentual.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${produto.percentual}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
              {dadosRevenda.produtos.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Nenhum produto encontrado no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Entregas Food-Service
            </CardTitle>
            <CardDescription className="text-left">
              {textoPeriodo}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Total Geral */}
              <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Total Entregue</p>
                <p className="text-3xl font-bold text-primary">
                  {dadosFoodService.totalUnidades.toLocaleString('pt-BR')} un
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {dadosFoodService.totalFormas.toLocaleString('pt-BR')} formas
                </p>
              </div>

              {/* Produtos Individuais - Collapsible */}
              {dadosFoodService.produtos.length > 0 && (
                <Collapsible open={isFoodServiceDetailsOpen} onOpenChange={setIsFoodServiceDetailsOpen}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-muted-foreground">Detalhes por Produto</p>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        {isFoodServiceDetailsOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="space-y-3">
                    {dadosFoodService.produtos.map((produto) => (
                      <div key={produto.nome} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{produto.nome}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm px-2 py-0.5">
                              {produto.formas.toLocaleString('pt-BR')} formas
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              {produto.percentual.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                        <div className="relative">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${produto.percentual}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Comparativo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Evolução da Entrega por Categoria
              </CardTitle>
              <CardDescription className="text-left">
                Comparativo mensal de {mostrarUnidades ? 'unidades entregues' : 'formas entregues'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-unidades" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                {mostrarUnidades ? 'Unidades' : 'Formas'}
              </Label>
              <Switch 
                id="toggle-unidades"
                checked={mostrarUnidades}
                onCheckedChange={setMostrarUnidades}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dadosGraficoComparativo.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>Nenhum dado disponível para o período</p>
            </div>
          ) : (
            <ChartContainer
              config={{
                revenda: {
                  label: "Revenda",
                  color: "hsl(262 83% 58%)",
                },
                foodService: {
                  label: "Food-Service",
                  color: "hsl(142 76% 36%)",
                },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoComparativo} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--foreground))' }}
                    label={{ 
                      value: mostrarUnidades ? 'Unidades Entregues' : 'Formas Entregues', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fill: 'hsl(var(--foreground))' }
                    }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent 
                      formatter={(value) => value.toLocaleString('pt-BR')}
                    />} 
                  />
                  <Legend />
                  <Bar 
                    dataKey="revenda" 
                    fill="var(--color-revenda)" 
                    name="Revenda"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="foodService" 
                    fill="var(--color-foodService)" 
                    name="Food-Service"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Card com detalhes adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Entregas</CardTitle>
          <CardDescription className="text-left">
            Análise comparativa do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground text-left">Faturamento Médio por Entrega</p>
                <p className="text-2xl font-bold text-left">
                  {indicadores.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground text-left">Clientes Atendidos</p>
                <p className="text-2xl font-bold text-left">{indicadores.clientesAtendidos}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
