
import { useState } from "react";
import { format, addDays, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import PageHeader from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export default function PCP() {
  const { sabores } = useSaborStore();
  const { getPedidosFiltrados, pedidos } = usePedidoStore();
  const { 
    setPeriodo, 
    calcularPlanejamento, 
    getPlanejamento, 
    getTotalFormasNecessarias, 
    getTotalUnidadesAgendadas,
    setCapacidadeForma,
    capacidadeForma
  } = usePlanejamentoProducaoStore();

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [numeroFormasPorLote, setNumeroFormasPorLote] = useState(10);
  const [mostrarPedidosPrevistos, setMostrarPedidosPrevistos] = useState(false);
  
  // Define o início e fim da semana para o planejamento
  const inicioSemana = startOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Segunda-feira
  const fimSemana = endOfWeek(dataSelecionada, { weekStartsOn: 1 }); // Domingo

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

  // Calcula o número de lotes necessários
  const lotesNecessarios = Math.ceil(getTotalFormasNecessarias() / numeroFormasPorLote);

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
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Configurações do PCP */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidades por forma:</label>
                <Input 
                  type="number" 
                  value={capacidadeForma} 
                  onChange={(e) => atualizarCapacidadeForma(parseInt(e.target.value) || 40)} 
                  min="1"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Formas por lote:</label>
                <Input 
                  type="number" 
                  value={numeroFormasPorLote} 
                  onChange={(e) => setNumeroFormasPorLote(parseInt(e.target.value) || 10)} 
                  min="1"
                  max="20"
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="mostrarPedidosPrevistos"
                  checked={mostrarPedidosPrevistos}
                  onChange={() => setMostrarPedidosPrevistos(!mostrarPedidosPrevistos)}
                  className="rounded border-gray-300"
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
                <span className="text-2xl font-semibold">{lotesNecessarios}</span>
              </div>
              <Alert className="mt-4">
                <AlertTitle>Próxima produção</AlertTitle>
                <AlertDescription>
                  Você precisa agendar {lotesNecessarios} {lotesNecessarios === 1 ? 'lote' : 'lotes'} de produção para atender a demanda semanal.
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
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Planejamento por Sabor</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sabor</TableHead>
                <TableHead className="text-right">Unidades</TableHead>
                <TableHead className="text-right">Formas</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getPlanejamento().length > 0 ? (
                getPlanejamento().map(item => (
                  <TableRow key={item.idSabor}>
                    <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                    <TableCell className="text-right">{item.totalUnidadesAgendadas}</TableCell>
                    <TableCell className="text-right">{item.formasNecessarias}</TableCell>
                    <TableCell className="text-right">
                      {Math.round((item.totalUnidadesAgendadas / getTotalUnidadesAgendadas()) * 100)}%
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                    Clique em "Calcular Produção" para ver o planejamento
                  </TableCell>
                </TableRow>
              )}
              {getPlanejamento().length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{getTotalUnidadesAgendadas()}</TableCell>
                  <TableCell className="text-right">{getTotalFormasNecessarias()}</TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
