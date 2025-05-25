import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar, Download, Calculator } from "lucide-react";
import { format } from "date-fns";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";

interface ProjecaoItem {
  idSabor: number;
  nomeSabor: string;
  unidadesNecessarias: number;
  estoqueDisponivel: number;
  unidadesProduzir: number;
  formasNecessarias: number;
  sobraEstimada: number;
}

type TipoAgendamento = 'agendados' | 'agendados-previstos';

export default function ProjecaoProducaoTab() {
  const [dataInicio, setDataInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [tipoAgendamento, setTipoAgendamento] = useState<TipoAgendamento>('agendados');
  const [projecaoItens, setProjecaoItens] = useState<ProjecaoItem[]>([]);
  const [temEstoqueManual, setTemEstoqueManual] = useState(false);

  const { pedidos } = usePedidoStore();
  const { sabores } = useSaborStore();
  const { capacidadeForma, incluirPedidosPrevistos, percentualPrevistos } = usePlanejamentoProducaoStore();

  // Verificar se há estoque manual configurado
  useEffect(() => {
    const estoqueManual = localStorage.getItem('estoque-manual-ajustes');
    setTemEstoqueManual(!!estoqueManual);
  }, []);

  // Calcular projeção quando parâmetros mudarem
  useEffect(() => {
    calcularProjecao();
  }, [dataInicio, dataFim, tipoAgendamento, pedidos, sabores]);

  const calcularProjecao = () => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Filtrar pedidos no período
    const pedidosNoPeriodo = pedidos.filter(pedido => {
      const dataPedido = new Date(pedido.dataPrevistaEntrega);
      return (
        (pedido.statusPedido === "Agendado" || pedido.statusPedido === "Em Separação") &&
        !pedido.dataEfetivaEntrega &&
        dataPedido >= inicio &&
        dataPedido <= fim
      );
    });

    // Inicializar contadores por sabor
    const necessidadePorSabor: Record<number, number> = {};

    sabores.forEach(sabor => {
      necessidadePorSabor[sabor.id] = 0;
    });

    // Somar pedidos agendados
    pedidosNoPeriodo.forEach(pedido => {
      pedido.itensPedido.forEach(item => {
        if (necessidadePorSabor[item.idSabor] !== undefined) {
          necessidadePorSabor[item.idSabor] += item.quantidadeSabor;
        }
      });
    });

    // Adicionar pedidos previstos se selecionado
    if (tipoAgendamento === 'agendados-previstos') {
      const saboresAtivos = sabores.filter(s => s.ativo && s.percentualPadraoDist && s.percentualPadraoDist > 0);
      const totalAgendado = Object.values(necessidadePorSabor).reduce((sum, val) => sum + val, 0);
      const totalPrevisto = Math.round(totalAgendado * (percentualPrevistos / 100));

      saboresAtivos.forEach(sabor => {
        const unidadesPrevisao = Math.round(totalPrevisto * ((sabor.percentualPadraoDist || 0) / 100));
        necessidadePorSabor[sabor.id] += unidadesPrevisao;
      });
    }

    // Obter estoque (manual se houver, senão automático)
    const estoqueManualData = localStorage.getItem('estoque-manual-ajustes');
    const estoqueManual = estoqueManualData ? JSON.parse(estoqueManualData) : {};

    // Calcular projeção para cada sabor
    const projecao: ProjecaoItem[] = sabores.map(sabor => {
      const unidadesNecessarias = necessidadePorSabor[sabor.id] || 0;
      const estoqueDisponivel = estoqueManual[sabor.id] !== undefined 
        ? estoqueManual[sabor.id] 
        : sabor.saldoAtual;
      
      const unidadesProduzir = Math.max(0, unidadesNecessarias - estoqueDisponivel);
      const formasNecessarias = unidadesProduzir > 0 ? Math.ceil(unidadesProduzir / capacidadeForma) : 0;
      const sobraEstimada = formasNecessarias > 0 
        ? (formasNecessarias * capacidadeForma) - unidadesProduzir 
        : 0;

      return {
        idSabor: sabor.id,
        nomeSabor: sabor.nome,
        unidadesNecessarias,
        estoqueDisponivel,
        unidadesProduzir,
        formasNecessarias,
        sobraEstimada
      };
    }).filter(item => item.unidadesNecessarias > 0 || item.unidadesProduzir > 0);

    setProjecaoItens(projecao);
  };

  const totalFormas = projecaoItens.reduce((sum, item) => sum + item.formasNecessarias, 0);

  const exportarDados = (formato: 'pdf' | 'excel') => {
    // Implementação básica - em produção usaria bibliotecas específicas
    const dados = projecaoItens.map(item => ({
      'Sabor': item.nomeSabor,
      'Unidades Necessárias': item.unidadesNecessarias,
      'Estoque Disponível': item.estoqueDisponivel,
      'Unidades a Produzir': item.unidadesProduzir,
      'Formas Necessárias': item.formasNecessarias,
      'Sobra Estimada': item.sobraEstimada
    }));

    if (formato === 'excel') {
      const csvContent = [
        Object.keys(dados[0] || {}).join(','),
        ...dados.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projecao-producao-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Projeção de Produção
          </CardTitle>
          <CardDescription>
            Calcule automaticamente a necessidade de produção com base nos pedidos e estoque disponível
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de filtro */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={tipoAgendamento === 'agendados' ? 'default' : 'outline'}
                onClick={() => setTipoAgendamento('agendados')}
                size="sm"
              >
                Apenas Agendados
              </Button>
              <Button
                variant={tipoAgendamento === 'agendados-previstos' ? 'default' : 'outline'}
                onClick={() => setTipoAgendamento('agendados-previstos')}
                size="sm"
              >
                Agendados + Previstos
              </Button>
            </div>
          </div>

          {/* Indicador do modo ativo */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Considerando: {tipoAgendamento === 'agendados' ? 'somente pedidos agendados' : 'agendados + previstos'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de projeção */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Necessidade de Produção</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarDados('excel')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarDados('pdf')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sabor</TableHead>
                  <TableHead className="text-right">Unidades Necessárias</TableHead>
                  <TableHead className="text-right">Estoque Disponível</TableHead>
                  <TableHead className="text-right">Unidades a Produzir</TableHead>
                  <TableHead className="text-right">Formas Necessárias</TableHead>
                  <TableHead className="text-right">Sobra Estimada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projecaoItens.length > 0 ? (
                  projecaoItens.map((item) => (
                    <TableRow key={item.idSabor}>
                      <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                      <TableCell className="text-right">{item.unidadesNecessarias}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.estoqueDisponivel >= item.unidadesNecessarias ? 'text-green-600' : 'text-red-600'}>
                          {item.estoqueDisponivel}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.unidadesProduzir}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.formasNecessarias > 0 ? 'default' : 'secondary'}>
                          {item.formasNecessarias}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.sobraEstimada}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Nenhuma necessidade de produção identificada no período
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {projecaoItens.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de formas necessárias:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {totalFormas} formas
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Baseado em {capacidadeForma} unidades por forma
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
