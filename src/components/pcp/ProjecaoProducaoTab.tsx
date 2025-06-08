import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Download, AlertTriangle, Calculator } from "lucide-react";
import { format } from "date-fns";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

interface ProjecaoItem {
  idProduto: string;
  nomeProduto: string;
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
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();
  const { produtos } = useSupabaseProdutos();

  // Verificar se há estoque manual configurado
  useEffect(() => {
    const estoqueManual = localStorage.getItem('estoque-manual-ajustes');
    setTemEstoqueManual(!!estoqueManual);
  }, []);

  // Calcular projeção quando parâmetros mudarem
  useEffect(() => {
    calcularProjecao();
  }, [dataInicio, dataFim, tipoAgendamento, pedidos, produtos]);

  const calcularProjecao = () => {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Filtrar pedidos no período usando dados do sistema de agendamento
    const agendamentosNoPeriodo = pedidos.filter(pedido => {
      const dataPedido = new Date(pedido.dataPrevistaEntrega);
      return (
        (pedido.statusPedido === "Agendado" || pedido.statusPedido === "Em Separação") &&
        !pedido.dataEfetivaEntrega &&
        dataPedido >= inicio &&
        dataPedido <= fim
      );
    });

    // Inicializar contadores por produto
    const necessidadePorProduto: Record<string, number> = {};

    produtos.forEach(produto => {
      if (produto.ativo) {
        necessidadePorProduto[produto.id] = 0;
      }
    });

    // Processar pedidos agendados
    agendamentosNoPeriodo.forEach(pedido => {
      if (pedido.tipoPedido === 'Padrão') {
        // Para pedidos padrão, usar proporção configurada
        if (temProporcoesConfiguradas()) {
          const quantidadesProporcao = calcularQuantidadesPorProporcao(pedido.totalPedidoUnidades);
          quantidadesProporcao.forEach(item => {
            const produto = produtos.find(p => p.nome === item.produto);
            if (produto && necessidadePorProduto[produto.id] !== undefined) {
              necessidadePorProduto[produto.id] += item.quantidade;
            }
          });
        }
      } else if (pedido.tipoPedido === 'Alterado' && pedido.itensPedido) {
        // Para pedidos alterados, usar quantidades específicas
        // Nota: Assumindo que itensPedido contém informações de produtos
        // Esta parte pode precisar de ajuste dependendo da estrutura real dos dados
        pedido.itensPedido.forEach(item => {
          // Aqui seria necessário mapear os itens do pedido para produtos
          // Por enquanto, usando uma lógica simplificada
          if (necessidadePorProduto[item.idSabor] !== undefined) {
            necessidadePorProduto[item.idSabor] += item.quantidadeSabor;
          }
        });
      }
    });

    // Adicionar pedidos previstos se selecionado
    if (tipoAgendamento === 'agendados-previstos' && temProporcoesConfiguradas()) {
      const totalAgendado = Object.values(necessidadePorProduto).reduce((sum, val) => sum + val, 0);
      const totalPrevisto = Math.round(totalAgendado * (percentualPrevistos / 100));

      if (totalPrevisto > 0) {
        const quantidadesPrevisao = calcularQuantidadesPorProporcao(totalPrevisto);
        quantidadesPrevisao.forEach(item => {
          const produto = produtos.find(p => p.nome === item.produto);
          if (produto && necessidadePorProduto[produto.id] !== undefined) {
            necessidadePorProduto[produto.id] += item.quantidade;
          }
        });
      }
    }

    // Obter estoque (manual se houver, senão automático)
    const estoqueManualData = localStorage.getItem('estoque-manual-ajustes');
    const estoqueManual = estoqueManualData ? JSON.parse(estoqueManualData) : {};

    // Calcular projeção para cada produto
    const projecao: ProjecaoItem[] = produtos
      .filter(produto => produto.ativo)
      .map(produto => {
        const unidadesNecessarias = necessidadePorProduto[produto.id] || 0;
        const estoqueDisponivel = estoqueManual[produto.id] !== undefined 
          ? estoqueManual[produto.id] 
          : produto.estoque_atual || 0;
        
        const unidadesProduzir = Math.max(0, unidadesNecessarias - estoqueDisponivel);
        const formasNecessarias = unidadesProduzir > 0 ? Math.ceil(unidadesProduzir / capacidadeForma) : 0;
        const sobraEstimada = formasNecessarias > 0 
          ? (formasNecessarias * capacidadeForma) - unidadesProduzir 
          : Math.max(0, estoqueDisponivel - unidadesNecessarias);

        return {
          idProduto: produto.id,
          nomeProduto: produto.nome,
          unidadesNecessarias,
          estoqueDisponivel,
          unidadesProduzir,
          formasNecessarias,
          sobraEstimada
        };
      })
      .filter(item => item.unidadesNecessarias > 0 || item.unidadesProduzir > 0);

    setProjecaoItens(projecao);
  };

  const totalFormas = projecaoItens.reduce((sum, item) => sum + item.formasNecessarias, 0);

  const exportarDados = (formato: 'pdf' | 'excel') => {
    // Implementação básica - em produção usaria bibliotecas específicas
    const dados = projecaoItens.map(item => ({
      'Sabor': item.nomeProduto,
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
      {/* Controles de filtro - keep existing code */}
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
                disabled={!temProporcoesConfiguradas()}
              >
                Agendados + Previstos
                {!temProporcoesConfiguradas() && (
                  <span className="text-xs ml-1">(Configure proporções)</span>
                )}
              </Button>
            </div>
          </div>

          {/* Indicador do modo ativo */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Considerando: {tipoAgendamento === 'agendados' ? 'somente pedidos agendados' : 'agendados + previstos'}
            </Badge>
            {!temEstoqueManual && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Estoque não verificado manualmente
              </Badge>
            )}
            {!temProporcoesConfiguradas() && (
              <Badge variant="outline" className="text-red-600 border-red-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Proporções padrão não configuradas
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerta sobre proporções */}
      {!temProporcoesConfiguradas() && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠ Proporções padrão não configuradas — projeção pode estar incompleta para pedidos do tipo "Padrão".
            Configure as proporções em Configurações &gt; % Proporção Padrão.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta sobre estoque - keep existing code */}
      {!temEstoqueManual && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠ Estoque não verificado manualmente — projeção pode estar imprecisa.
            Considere usar a aba "Ajuste de Estoque" para validar os valores.
          </AlertDescription>
        </Alert>
      )}

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
                  <TableHead>Produto</TableHead>
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
                    <TableRow key={item.idProduto}>
                      <TableCell className="font-medium">{item.nomeProduto}</TableCell>
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
