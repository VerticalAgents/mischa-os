
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pedido } from "@/types";

interface OrdersListProps {
  pedidosNoPeriodo: Pedido[];
}

export default function OrdersList({ pedidosNoPeriodo }: OrdersListProps) {
  return (
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
  );
}
