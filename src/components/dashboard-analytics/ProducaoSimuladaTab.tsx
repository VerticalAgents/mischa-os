
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Download, TrendingUp, Info } from "lucide-react";
import { format, addMonths } from "date-fns";
import { useSaborStore } from "@/hooks/useSaborStore";
import { usePlanejamentoProducaoStore } from "@/hooks/usePlanejamentoProducaoStore";
import { Cliente } from "@/types";

interface ProducaoSimuladaItem {
  idSabor: number;
  nomeSabor: string;
  formasPrevistas: number;
  unidadesPrevistas: number;
  sobraEstimada: number;
}

interface ProducaoSimuladaTabProps {
  clientes: Cliente[];
}

export default function ProducaoSimuladaTab({ clientes }: ProducaoSimuladaTabProps) {
  const [mesInicio, setMesInicio] = useState(format(new Date(), 'yyyy-MM'));
  const [simulacaoItens, setSimulacaoItens] = useState<ProducaoSimuladaItem[]>([]);

  const { sabores } = useSaborStore();
  const { capacidadeForma } = usePlanejamentoProducaoStore();

  // Calculate simulation when parameters change
  useEffect(() => {
    calcularSimulacao();
  }, [mesInicio, clientes, sabores]);

  const calcularSimulacao = () => {
    const saboresAtivos = sabores.filter(s => s.ativo);
    
    if (saboresAtivos.length === 0) {
      setSimulacaoItens([]);
      return;
    }

    // Calculate based on average weekly turnover of clients
    const simulacao: ProducaoSimuladaItem[] = saboresAtivos.map(sabor => {
      // Calculate monthly demand based on client turnover patterns
      // This is a simplified calculation - in a real app, this would use historical data
      let demandaMensalEstimada = 0;
      
      clientes.forEach(cliente => {
        if (cliente.ativo && cliente.giroMedioSemanal && cliente.giroMedioSemanal > 0) {
          // Estimate client demand for this flavor based on distribution percentage
          const demandaClienteMensal = cliente.giroMedioSemanal * 4.33; // weeks per month
          const demandaSabor = demandaClienteMensal * ((sabor.percentualPadraoDist || 0) / 100);
          demandaMensalEstimada += demandaSabor;
        }
      });

      const unidadesPrevistas = Math.round(demandaMensalEstimada);
      const formasPrevistas = unidadesPrevistas > 0 ? Math.ceil(unidadesPrevistas / capacidadeForma) : 0;
      const sobraEstimada = formasPrevistas > 0 
        ? (formasPrevistas * capacidadeForma) - unidadesPrevistas 
        : 0;

      return {
        idSabor: sabor.id,
        nomeSabor: sabor.nome,
        formasPrevistas,
        unidadesPrevistas,
        sobraEstimada
      };
    }).filter(item => item.unidadesPrevistas > 0 || item.formasPrevistas > 0);

    setSimulacaoItens(simulacao);
  };

  const totalFormas = simulacaoItens.reduce((sum, item) => sum + item.formasPrevistas, 0);
  const totalUnidades = simulacaoItens.reduce((sum, item) => sum + item.unidadesPrevistas, 0);

  const exportarDados = (formato: 'pdf' | 'excel') => {
    // Basic implementation - in production would use specific libraries
    const dados = simulacaoItens.map(item => ({
      'Sabor': item.nomeSabor,
      'Formas Previstas': item.formasPrevistas,
      'Unidades Previstas': item.unidadesPrevistas,
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
      a.download = `producao-simulada-${format(new Date(), 'yyyy-MM')}.csv`;
      a.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Produção Simulada (Mensal)
          </CardTitle>
          <CardDescription>
            Visualize a demanda mensal estimada com base no giro médio semanal de cada cliente, considerando a média histórica de pedidos. Esta visão ajuda a entender a estrutura necessária de produção mensal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de filtro */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="mes-inicio">Mês de Simulação</Label>
              <Input
                id="mes-inicio"
                type="month"
                value={mesInicio}
                onChange={(e) => setMesInicio(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Essa projeção não utiliza os pedidos agendados. É baseada unicamente na média de giro dos clientes.
        </AlertDescription>
      </Alert>

      {/* Tabela de simulação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Demanda Mensal Estimada</CardTitle>
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
                  <TableHead className="text-right">Formas Previstas</TableHead>
                  <TableHead className="text-right">Unidades Previstas</TableHead>
                  <TableHead className="text-right">Sobra Estimada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulacaoItens.length > 0 ? (
                  simulacaoItens.map((item) => (
                    <TableRow key={item.idSabor}>
                      <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.formasPrevistas > 0 ? 'default' : 'secondary'}>
                          {item.formasPrevistas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.unidadesPrevistas}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.sobraEstimada}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Nenhuma demanda simulada identificada para o período
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {simulacaoItens.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de formas estimadas:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {totalFormas} formas
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de unidades estimadas:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {totalUnidades} unidades
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Baseado em {capacidadeForma} unidades por forma e giro médio dos clientes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
