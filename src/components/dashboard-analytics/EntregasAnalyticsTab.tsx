
import { useState, useEffect } from "react";
import { Calendar, TrendingUp, Package, DollarSign, Users, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { useClienteStore } from "@/hooks/useClienteStore";
import AuditoriaEntregas from "./AuditoriaEntregas";
import EntregasIndicadores from "./EntregasIndicadores";

export default function EntregasAnalyticsTab() {
  const [dataInicio, setDataInicio] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showAuditoria, setShowAuditoria] = useState(false);
  const [indicadoresResumo, setIndicadoresResumo] = useState({
    totalEntregas: 0,
    faturamentoTotal: 0,
    clientesAtendidos: 0,
    ticketMedio: 0
  });
  const [loading, setLoading] = useState(false);

  const { carregarHistorico, registros } = useHistoricoEntregasStore();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const { clientes } = useClienteStore();

  // Calcular indicadores do período
  const calcularIndicadores = async () => {
    if (!registros || registros.length === 0) return;

    setLoading(true);
    try {
      const dataInicioDate = new Date(dataInicio);
      const dataFimDate = new Date(dataFim);
      
      const entregasPeriodo = registros.filter(h => {
        const dataEntrega = new Date(h.data);
        return dataEntrega >= dataInicioDate && dataEntrega <= dataFimDate;
      });

      const entregas = entregasPeriodo.filter(e => e.tipo === 'entrega');
      let faturamentoTotal = 0;
      let ticketTotal = 0;

      // Calcular faturamento por entrega
      for (const entrega of entregas) {
        try {
          const precos = await carregarPrecosPorCliente(entrega.cliente_id);
          const precosMap: { [key: string]: number } = {};
          
          precos.forEach(preco => {
            precosMap[preco.categoria_id.toString()] = preco.preco_unitario;
          });

          let faturamentoEntrega = 0;
          
          if (entrega.itens && entrega.itens.length > 0) {
            entrega.itens.forEach((item: any) => {
              const precoItem = precosMap[item.categoria_id?.toString()];
              if (precoItem && item.quantidade) {
                faturamentoEntrega += item.quantidade * precoItem;
              }
            });
          } else {
            const cliente = clientes.find(c => c.id === entrega.cliente_id);
            if (cliente?.categoriasHabilitadas && Array.isArray(cliente.categoriasHabilitadas)) {
              const totalCategorias = cliente.categoriasHabilitadas.length;
              const quantidadePorCategoria = entrega.quantidade / totalCategorias;
              
              cliente.categoriasHabilitadas.forEach((categoria: any) => {
                const precoCategoria = precosMap[categoria.id?.toString()];
                if (precoCategoria) {
                  faturamentoEntrega += quantidadePorCategoria * precoCategoria;
                }
              });
            }
          }

          faturamentoTotal += faturamentoEntrega;
          ticketTotal += faturamentoEntrega;
        } catch (error) {
          console.error('Erro ao calcular faturamento da entrega:', error);
        }
      }

      const clientesUnicos = new Set(entregas.map(e => e.cliente_id));
      const ticketMedio = entregas.length > 0 ? ticketTotal / entregas.length : 0;

      setIndicadoresResumo({
        totalEntregas: entregas.length,
        faturamentoTotal,
        clientesAtendidos: clientesUnicos.size,
        ticketMedio
      });
    } catch (error) {
      console.error('Erro ao calcular indicadores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando período ou registros mudam
  useEffect(() => {
    const carregarDados = async () => {
      await carregarHistorico();
      await calcularIndicadores();
    };
    
    carregarDados();
  }, [dataInicio, dataFim]);

  useEffect(() => {
    calcularIndicadores();
  }, [registros]);

  const handlePeriodoChange = () => {
    calcularIndicadores();
  };

  return (
    <div className="space-y-6">
      {/* Header com seleção de período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Entregas</h2>
          <p className="text-muted-foreground">
            Indicadores de performance e faturamento das entregas
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="dataInicio">De:</Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="dataFim">Até:</Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={handlePeriodoChange} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Aplicar Filtro
          </Button>
        </div>
      </div>

      {/* Indicadores principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entregas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : indicadoresResumo.totalEntregas}
            </div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `R$ ${indicadoresResumo.faturamentoTotal.toFixed(2).replace('.', ',')}`}
            </div>
            <p className="text-xs text-muted-foreground">
              valor faturado no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : indicadoresResumo.clientesAtendidos}
            </div>
            <p className="text-xs text-muted-foreground">
              clientes únicos no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : `R$ ${indicadoresResumo.ticketMedio.toFixed(2).replace('.', ',')}`}
            </div>
            <p className="text-xs text-muted-foreground">
              por entrega no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para navegação */}
      <Tabs defaultValue="indicadores" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="indicadores">Indicadores</TabsTrigger>
          <TabsTrigger 
            value="auditoria"
            onClick={() => setShowAuditoria(true)}
          >
            Auditoria Entregas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="indicadores" className="mt-0">
          <EntregasIndicadores 
            dataInicio={dataInicio}
            dataFim={dataFim}
          />
        </TabsContent>
        
        <TabsContent value="auditoria" className="mt-0">
          {showAuditoria && (
            <AuditoriaEntregas 
              dataInicio={dataInicio}
              dataFim={dataFim}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
