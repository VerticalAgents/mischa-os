
import { usePedidoStore } from '@/hooks/usePedidoStore';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useExpedicaoStore } from '@/hooks/useExpedicaoStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Package, Truck, Calendar } from 'lucide-react';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pedido } from '@/types';

export default function OperationalSummary() {
  const { pedidos } = usePedidoStore();
  const { clientes } = useClienteStore();
  const { pedidos: pedidosExpedicao } = useExpedicaoStore();

  // Calcular métricas operacionais
  const hoje = new Date();
  const inicioSemana = startOfWeek(hoje);
  const fimSemana = endOfWeek(hoje);

  // Pedidos desta semana
  const pedidosEstaSemana = pedidos.filter((pedido: Pedido) =>
    isWithinInterval(pedido.dataPedido, { start: inicioSemana, end: fimSemana })
  );

  // Pedidos futuros
  const pedidosFuturos = pedidos.filter((pedido: Pedido) => 
    pedido.dataPrevistaEntrega > hoje
  );

  // Clientes ativos
  const clientesAtivos = clientes.filter(cliente => cliente.ativo && cliente.statusCliente === 'Ativo');

  // Pedidos para separação hoje
  const pedidosParaSeparacao = pedidosExpedicao.filter(pedido => 
    (!pedido.substatus_pedido || pedido.substatus_pedido === 'Agendado')
  );

  // Pedidos despachados aguardando entrega
  const pedidosDespachados = pedidosExpedicao.filter(pedido => 
    pedido.substatus_pedido === 'Despachado'
  );

  const metricas = [
    {
      titulo: "Pedidos Esta Semana",
      valor: pedidosEstaSemana.length,
      descricao: `${format(inicioSemana, 'dd/MM', { locale: ptBR })} - ${format(fimSemana, 'dd/MM', { locale: ptBR })}`,
      icone: Package,
      tendencia: pedidosEstaSemana.length > 0 ? "up" : "neutral",
      cor: "text-blue-600"
    },
    {
      titulo: "Clientes Ativos",
      valor: clientesAtivos.length,
      descricao: "Base ativa de clientes",
      icone: Users,
      tendencia: "neutral",
      cor: "text-green-600"
    },
    {
      titulo: "Para Separação Hoje",
      valor: pedidosParaSeparacao.length,
      descricao: "Aguardando separação",
      icone: Package,
      tendencia: pedidosParaSeparacao.length > 5 ? "up" : "neutral",
      cor: "text-orange-600"
    },
    {
      titulo: "Em Trânsito",
      valor: pedidosDespachados.length,
      descricao: "Despachados hoje",
      icone: Truck,
      tendencia: "neutral",
      cor: "text-purple-600"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricas.map((metrica, index) => {
          const IconeComponente = metrica.icone;
          
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metrica.titulo}
                </CardTitle>
                <IconeComponente className={`h-4 w-4 ${metrica.cor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrica.valor}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {metrica.tendencia === "up" && (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  )}
                  {metrica.tendencia === "down" && (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span>{metrica.descricao}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Lista de Próximas Entregas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próximas Entregas
          </CardTitle>
          <CardDescription>
            Pedidos agendados para os próximos dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pedidosFuturos.slice(0, 5).map((pedido) => (
              <div key={pedido.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {pedido.cliente?.nome || 'Cliente não informado'}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(pedido.dataPrevistaEntrega, 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <Badge variant="outline">
                  {pedido.statusPedido}
                </Badge>
              </div>
            ))}
            {pedidosFuturos.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma entrega agendada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
