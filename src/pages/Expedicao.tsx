
import { useState, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeparacaoPedidos } from "@/components/expedicao/SeparacaoPedidos";
import { Despacho } from "@/components/expedicao/Despacho";
import { HistoricoEntregas } from "@/components/expedicao/HistoricoEntregas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { format, isToday, isTomorrow, isYesterday, addBusinessDays, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper function to get the next business day
const getProximoDiaUtil = (data: Date): Date => {
  const proximaData = addBusinessDays(new Date(data), 1);
  return isWeekend(proximaData) ? getProximoDiaUtil(proximaData) : proximaData;
};

interface PedidoAgendadoHoje {
  cliente: any;
  dataReposicao: Date;
  statusAgendamento: string;
  quantidadeTotal: number;
  tipoPedido: 'Padrão' | 'Alterado';
}

export default function Expedicao() {
  const [activeTab, setActiveTab] = useState<string>("separacao");
  const [entregasTab, setEntregasTab] = useState<string>("hoje");
  const [pedidosHoje, setPedidosHoje] = useState<PedidoAgendadoHoje[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { clientes, carregarClientes } = useClienteStore();
  const { carregarAgendamentoPorCliente } = useAgendamentoClienteStore();
  
  // Get today's date with time set to beginning of day for comparison
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Calculate next business day
  const proximoDiaUtil = getProximoDiaUtil(hoje);

  // Carregar pedidos agendados para hoje
  useEffect(() => {
    const carregarPedidosHoje = async () => {
      if (clientes.length === 0) {
        await carregarClientes();
        return;
      }
      
      setLoading(true);
      console.log('Expedicao: Carregando pedidos agendados para hoje');
      
      const pedidosAgendadosHoje: PedidoAgendadoHoje[] = [];
      
      for (const cliente of clientes.filter(c => c.statusCliente === 'Ativo')) {
        try {
          const agendamento = await carregarAgendamentoPorCliente(cliente.id);
          
          if (agendamento && 
              agendamento.status_agendamento === 'Agendado' && 
              agendamento.data_proxima_reposicao) {
            
            const dataAgendamento = new Date(agendamento.data_proxima_reposicao);
            dataAgendamento.setHours(0, 0, 0, 0);
            
            // Verificar se a data é hoje
            if (dataAgendamento.getTime() === hoje.getTime()) {
              pedidosAgendadosHoje.push({
                cliente,
                dataReposicao: agendamento.data_proxima_reposicao,
                statusAgendamento: agendamento.status_agendamento,
                quantidadeTotal: agendamento.quantidade_total,
                tipoPedido: agendamento.tipo_pedido
              });
            }
          }
        } catch (error) {
          console.error('Expedicao: Erro ao carregar agendamento do cliente', cliente.nome, ':', error);
        }
      }
      
      console.log('Expedicao: Pedidos agendados para hoje:', pedidosAgendadosHoje.length);
      setPedidosHoje(pedidosAgendadosHoje);
      setLoading(false);
    };

    carregarPedidosHoje();
  }, [clientes, carregarClientes, carregarAgendamentoPorCliente]);

  const PedidosAgendadosHoje = () => (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos Agendados para Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Carregando pedidos...</p>
          </div>
        ) : pedidosHoje.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Nenhum pedido agendado para hoje
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidosHoje.map((pedido, index) => (
                <TableRow key={`${pedido.cliente.id}-${index}`}>
                  <TableCell className="font-medium">
                    {pedido.cliente.nome}
                  </TableCell>
                  <TableCell>
                    {pedido.quantidadeTotal}
                  </TableCell>
                  <TableCell>
                    <Badge variant={pedido.tipoPedido === 'Alterado' ? "secondary" : "outline"}>
                      {pedido.tipoPedido}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {pedido.statusAgendamento}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Expedição" 
        description="Gerenciamento de separação de pedidos e despacho de entregas" 
      />
      
      <Tabs defaultValue="separacao" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="separacao">Separação de Pedidos</TabsTrigger>
          <TabsTrigger value="despacho">Despacho de Pedidos</TabsTrigger>
          <TabsTrigger value="agendados">Pedidos Agendados Hoje</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Entregas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="separacao" className="space-y-4">
          <SeparacaoPedidos />
        </TabsContent>
        
        <TabsContent value="despacho" className="space-y-4">
          <Tabs defaultValue="hoje" value={entregasTab} onValueChange={setEntregasTab} className="space-y-4">
            <TabsList className="w-full border-b">
              <TabsTrigger value="hoje" className="data-[state=active]:bg-green-500/10 data-[state=active]:text-green-700">
                🟢 Entregas de Hoje
              </TabsTrigger>
              <TabsTrigger value="atrasadas" className="data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-700">
                🟡 Entregas Atrasadas (Ontem)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hoje">
              <Despacho tipoFiltro="hoje" />
            </TabsContent>
            
            <TabsContent value="atrasadas">
              <Despacho tipoFiltro="atrasadas" />
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="agendados" className="space-y-4">
          <div className="space-y-4">
            <PedidosAgendadosHoje />
            
            <Tabs defaultValue="todos" className="space-y-4">
              <TabsList>
                <TabsTrigger value="todos">Todos os Pedidos</TabsTrigger>
                <TabsTrigger value="padrao">Pedidos Padrão</TabsTrigger>
                <TabsTrigger value="alterado">Pedidos Alterados</TabsTrigger>
              </TabsList>
              
              <TabsContent value="todos">
                <Card>
                  <CardHeader>
                    <CardTitle>Todos os Pedidos Agendados para Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PedidosAgendadosHoje />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="padrao">
                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos Padrão - Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Carregando pedidos...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pedidosHoje
                            .filter(p => p.tipoPedido === 'Padrão')
                            .map((pedido, index) => (
                              <TableRow key={`padrao-${pedido.cliente.id}-${index}`}>
                                <TableCell className="font-medium">
                                  {pedido.cliente.nome}
                                </TableCell>
                                <TableCell>
                                  {pedido.quantidadeTotal}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default">
                                    {pedido.statusAgendamento}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {!loading && pedidosHoje.filter(p => p.tipoPedido === 'Padrão').length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum pedido padrão agendado para hoje
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="alterado">
                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos Alterados - Hoje</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Carregando pedidos...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Quantidade</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pedidosHoje
                            .filter(p => p.tipoPedido === 'Alterado')
                            .map((pedido, index) => (
                              <TableRow key={`alterado-${pedido.cliente.id}-${index}`}>
                                <TableCell className="font-medium">
                                  {pedido.cliente.nome}
                                </TableCell>
                                <TableCell>
                                  {pedido.quantidadeTotal}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="default">
                                    {pedido.statusAgendamento}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {!loading && pedidosHoje.filter(p => p.tipoPedido === 'Alterado').length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhum pedido alterado agendado para hoje
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4">
          <HistoricoEntregas />
        </TabsContent>
      </Tabs>
    </div>
  );
}
