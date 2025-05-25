
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, AlertTriangle, RefreshCw } from "lucide-react";
import { format, addDays, isToday } from "date-fns";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";

interface NecessidadeDiaria {
  data: Date;
  sabores: Record<number, {
    necessidade: number;
    producaoAgendada: number;
    estoqueAcumulado: number;
    statusEstoque: 'suficiente' | 'insuficiente';
  }>;
}

export default function NecessidadeDiariaTab() {
  const [mostrarPedidosPrevistos, setMostrarPedidosPrevistos] = useState(false);
  const [saboresFiltrados, setSaboresFiltrados] = useState<number[]>([]);
  const [necessidadeDiaria, setNecessidadeDiaria] = useState<NecessidadeDiaria[]>([]);
  const [temEstoqueManual, setTemEstoqueManual] = useState(false);

  const { pedidos } = usePedidoStore();
  const { sabores } = useSaborStore();
  const { capacidadeForma, percentualPrevistos } = usePlanejamentoProducaoStore();

  // Verificar se há estoque manual configurado
  useEffect(() => {
    const estoqueManual = localStorage.getItem('estoque-manual-ajustes');
    setTemEstoqueManual(!!estoqueManual);
  }, []);

  // Gerar array de 30 dias a partir de hoje
  const proximosTrintaDias = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i));

  // Calcular necessidade diária quando dados mudarem
  useEffect(() => {
    calcularNecessidadeDiaria();
  }, [pedidos, sabores, mostrarPedidosPrevistos]);

  const calcularNecessidadeDiaria = () => {
    const saboresAtivos = sabores.filter(s => s.ativo);
    
    // Obter estoque inicial (manual se houver, senão automático)
    const estoqueManualData = localStorage.getItem('estoque-manual-ajustes');
    const estoqueManual = estoqueManualData ? JSON.parse(estoqueManualData) : {};
    
    const estoqueInicial: Record<number, number> = {};
    saboresAtivos.forEach(sabor => {
      estoqueInicial[sabor.id] = estoqueManual[sabor.id] !== undefined 
        ? estoqueManual[sabor.id] 
        : sabor.saldoAtual;
    });

    const resultado: NecessidadeDiaria[] = proximosTrintaDias.map(data => {
      // Filtrar pedidos para esta data
      const pedidosNaData = pedidos.filter(pedido => {
        const dataPedido = new Date(pedido.dataPrevistaEntrega);
        return (
          (pedido.statusPedido === "Agendado" || pedido.statusPedido === "Em Separação") &&
          !pedido.dataEfetivaEntrega &&
          dataPedido.toDateString() === data.toDateString()
        );
      });

      // Calcular necessidade por sabor
      const saboresData: Record<number, any> = {};
      
      saboresAtivos.forEach(sabor => {
        let necessidadeTotal = 0;

        // Somar pedidos agendados
        pedidosNaData.forEach(pedido => {
          const item = pedido.itensPedido.find(i => i.idSabor === sabor.id);
          if (item) {
            necessidadeTotal += item.quantidadeSabor;
          }
        });

        // Adicionar pedidos previstos se ativado
        if (mostrarPedidosPrevistos && sabor.percentualPadraoDist && sabor.percentualPadraoDist > 0) {
          const totalAgendadoNaData = pedidosNaData.reduce((sum, pedido) => 
            sum + pedido.totalPedidoUnidades, 0);
          const totalPrevisto = Math.round(totalAgendadoNaData * (percentualPrevistos / 100));
          const unidadesPrevisao = Math.round(totalPrevisto * (sabor.percentualPadraoDist / 100));
          necessidadeTotal += unidadesPrevisao;
        }

        saboresData[sabor.id] = {
          necessidade: necessidadeTotal,
          producaoAgendada: 0, // Mock - em produção viria de um sistema de agendamento
          estoqueAcumulado: 0, // Será calculado após
          statusEstoque: 'suficiente' as const
        };
      });

      return {
        data,
        sabores: saboresData
      };
    });

    // Calcular estoque acumulado dia a dia
    const estoqueAcumulado = { ...estoqueInicial };
    
    resultado.forEach((dia, index) => {
      saboresAtivos.forEach(sabor => {
        if (dia.sabores[sabor.id]) {
          // Se não é o primeiro dia, somar produção do dia anterior
          if (index > 0) {
            const producaoAnterior = resultado[index - 1].sabores[sabor.id]?.producaoAgendada || 0;
            estoqueAcumulado[sabor.id] += producaoAnterior * capacidadeForma;
          }

          // Subtrair necessidade do dia
          estoqueAcumulado[sabor.id] -= dia.sabores[sabor.id].necessidade;

          // Atualizar dados do dia
          dia.sabores[sabor.id].estoqueAcumulado = estoqueAcumulado[sabor.id];
          dia.sabores[sabor.id].statusEstoque = estoqueAcumulado[sabor.id] >= 0 ? 'suficiente' : 'insuficiente';
        }
      });
    });

    setNecessidadeDiaria(resultado);
  };

  const saboresParaExibir = sabores.filter(sabor => 
    sabor.ativo && (saboresFiltrados.length === 0 || saboresFiltrados.includes(sabor.id))
  );

  const toggleFiltroSabor = (saborId: number) => {
    setSaboresFiltrados(prev => 
      prev.includes(saborId) 
        ? prev.filter(id => id !== saborId)
        : [...prev, saborId]
    );
  };

  const atualizarEstoque = () => {
    // Redirecionar para aba de ajuste de estoque
    window.location.hash = '#ajuste-estoque';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Necessidade Diária de Produção (30 dias)
          </CardTitle>
          <CardDescription>
            Visualização da necessidade de produção por sabor nos próximos 30 dias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="incluir-previstos"
                  checked={mostrarPedidosPrevistos}
                  onCheckedChange={setMostrarPedidosPrevistos}
                />
                <Label htmlFor="incluir-previstos">Incluir pedidos previstos</Label>
              </div>
              
              {!temEstoqueManual && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={atualizarEstoque}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar estoque
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {sabores.filter(s => s.ativo).map(sabor => (
                <Button
                  key={sabor.id}
                  variant={saboresFiltrados.length === 0 || saboresFiltrados.includes(sabor.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFiltroSabor(sabor.id)}
                >
                  {sabor.nome.substring(0, 1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre estoque */}
      {!temEstoqueManual && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠ Estoque não verificado manualmente. Considere usar a aba "Ajuste de Estoque" para validar os valores.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabela de Necessidade Diária */}
      <Card>
        <CardHeader>
          <CardTitle>Necessidade por Sabor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background">Sabor</TableHead>
                    {proximosTrintaDias.map((data, index) => (
                      <TableHead key={index} className="text-center min-w-[60px]">
                        <div className="text-xs">
                          <div>{format(data, 'dd/MM')}</div>
                          <div className="text-muted-foreground">{format(data, 'EEE').substring(0, 3)}</div>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saboresParaExibir.map(sabor => (
                    <TableRow key={sabor.id}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {sabor.nome}
                      </TableCell>
                      {necessidadeDiaria.map((dia, index) => {
                        const dadosSabor = dia.sabores[sabor.id];
                        if (!dadosSabor || dadosSabor.necessidade === 0) {
                          return <TableCell key={index} className="text-center text-muted-foreground">-</TableCell>;
                        }

                        const isInsuficiente = dadosSabor.statusEstoque === 'insuficiente';
                        
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <TableCell 
                                className={`text-center cursor-help ${
                                  isInsuficiente 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : 'bg-green-100 text-green-800 border border-green-200'
                                } ${isToday(dia.data) ? 'ring-2 ring-blue-500' : ''}`}
                              >
                                {dadosSabor.necessidade}
                                {isInsuficiente && (
                                  <AlertTriangle className="h-3 w-3 inline ml-1" />
                                )}
                              </TableCell>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div>Necessidade: {dadosSabor.necessidade}</div>
                                <div>Estoque: {dadosSabor.estoqueAcumulado}</div>
                                {isInsuficiente && (
                                  <div className="text-red-600 font-medium">
                                    ⚠ Estoque insuficiente. Risco de ruptura.
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produção Agendada */}
      <Card>
        <CardHeader>
          <CardTitle>Produção Agendada (Formas)</CardTitle>
          <CardDescription>
            Quantidade de formas programadas para produção por data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background">Sabor</TableHead>
                  {proximosTrintaDias.map((data, index) => (
                    <TableHead key={index} className="text-center min-w-[60px]">
                      <div className="text-xs">
                        <div>{format(data, 'dd/MM')}</div>
                        <div className="text-muted-foreground">{format(data, 'EEE').substring(0, 3)}</div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {saboresParaExibir.map(sabor => (
                  <TableRow key={sabor.id}>
                    <TableCell className="sticky left-0 bg-background font-medium">
                      {sabor.nome}
                    </TableCell>
                    {necessidadeDiaria.map((dia, index) => {
                      const dadosSabor = dia.sabores[sabor.id];
                      const formasAgendadas = dadosSabor?.producaoAgendada || 0;
                      
                      return (
                        <TableCell key={index} className={`text-center ${isToday(dia.data) ? 'ring-2 ring-blue-500' : ''}`}>
                          {formasAgendadas > 0 ? formasAgendadas : '-'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Estoque suficiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
              <span>Estoque insuficiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-background border-2 border-blue-500 rounded"></div>
              <span>Hoje</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
