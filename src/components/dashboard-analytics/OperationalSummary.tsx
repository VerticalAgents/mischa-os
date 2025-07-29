
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useClienteStore } from "@/hooks/useClienteStore";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useEffect } from "react";
import { Calendar, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function OperationalSummary() {
  const { clientes, carregarClientes, getClientePorId } = useClienteStore();
  const { pedidos, carregarPedidos, getPedidosFuturos } = usePedidoStore();

  useEffect(() => {
    carregarClientes();
    carregarPedidos();
  }, [carregarClientes, carregarPedidos]);

  // Calcular estatísticas
  const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo').length;
  const clientesInAtivos = clientes.filter(c => c.statusCliente === 'Inativo').length;
  const pedidosPendentes = pedidos.filter(p => p.statusPedido === 'Pendente').length;
  const pedidosFuturos = getPedidosFuturos();

  // Próximas entregas (próximos 7 dias)
  const hoje = new Date();
  const proximasSemana = new Date();
  proximasSemana.setDate(hoje.getDate() + 7);
  
  const proximasEntregas = pedidosFuturos
    .filter(p => p.dataPrevistaEntrega <= proximasSemana)
    .slice(0, 5);

  // Alertas críticos
  const alertasCriticos = [
    ...pedidos.filter(p => p.statusPedido === 'Pendente' && p.dataPrevistaEntrega < hoje),
    ...clientes.filter(c => c.statusCliente === 'Ativo' && c.proximaDataReposicao && c.proximaDataReposicao < hoje)
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Estatísticas Gerais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clientesAtivos}</div>
          <p className="text-xs text-muted-foreground">
            {clientesInAtivos} inativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pedidosPendentes}</div>
          <p className="text-xs text-muted-foreground">
            Total: {pedidos.length} pedidos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Próximas Entregas</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{proximasEntregas.length}</div>
          <p className="text-xs text-muted-foreground">
            Próximos 7 dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Alertas Críticos</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">{alertasCriticos.length}</div>
          <p className="text-xs text-muted-foreground">
            Requer atenção
          </p>
        </CardContent>
      </Card>

      {/* Próximas Entregas Detalhadas */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Próximas Entregas</CardTitle>
          <CardDescription>Entregas programadas para os próximos 7 dias</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {proximasEntregas.length > 0 ? (
              proximasEntregas.map((pedido) => {
                const cliente = getClientePorId(pedido.clienteId);
                return (
                  <div key={pedido.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{cliente?.nome || 'Cliente não encontrado'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(pedido.dataPrevistaEntrega, 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant={pedido.statusPedido === 'Pendente' ? 'default' : 'secondary'}>
                      {pedido.statusPedido}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground">Nenhuma entrega programada</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alertas Críticos Detalhados */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Alertas Críticos</CardTitle>
          <CardDescription>Itens que requerem atenção imediata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alertasCriticos.length > 0 ? (
              alertasCriticos.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded border-red-200">
                  <div>
                    <p className="font-medium">
                      {'nome' in item ? item.nome : `Pedido ${item.id?.substring(0, 8)}`}
                    </p>
                    <p className="text-sm text-red-600">
                      {'statusPedido' in item ? 'Pedido em atraso' : 'Reposição em atraso'}
                    </p>
                  </div>
                  <Badge variant="destructive">Crítico</Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Nenhum alerta crítico</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
