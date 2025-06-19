
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pedido } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, User, Calendar, CheckCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import TipoPedidoBadge from "./TipoPedidoBadge";
import ProdutoNomeDisplay from "./ProdutoNomeDisplay";

interface PedidoCardProps {
  pedido: Pedido;
  onMarcarSeparado: (pedidoId: string) => void;
  onCancelar?: (pedidoId: string) => void;
}

interface StatusVariantProps {
  status: Pedido['statusPedido'];
}

function getStatusVariant(status: StatusVariantProps['status']) {
  if (status === 'Agendado') return 'default';
  if (status === 'Em Separação') return 'secondary';
  if (status === 'Cancelado') return 'destructive';
  return 'default';
}

export default function PedidoCard({ pedido, onMarcarSeparado, onCancelar }: PedidoCardProps) {
  const formatarData = (data: Date) => {
    return format(new Date(data), "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  const calcularValorTotal = () => {
    // Using a default price since ItemPedido doesn't have precoUnitario
    return pedido.itensPedido.reduce((total, item) => total + (10 * item.quantidadeSabor), 0);
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      pedido.substatusPedido === 'Separado' && "bg-green-50 border-green-200"
    )}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Pedido #{String(pedido.id).substring(0, 8)}
          </CardTitle>
          <div className="flex gap-2">
            <TipoPedidoBadge tipo={pedido.tipoPedido || "Padrão"} />
            <Badge variant={getStatusVariant(pedido.statusPedido)}>
              {pedido.statusPedido}
            </Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{pedido.cliente?.nome || 'Cliente não informado'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{pedido.cliente?.enderecoEntrega || 'Endereço não informado'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatarData(pedido.dataPrevistaEntrega)}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Itens do Pedido:</h4>
          <div className="space-y-2">
            {pedido.itensPedido.map((item, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="font-medium">
                    <ProdutoNomeDisplay 
                      produtoId={String(item.idSabor)} 
                      nomeFallback={item.nomeSabor}
                    />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.quantidadeSabor} un.
                  </Badge>
                </div>
                <span className="text-sm text-muted-foreground">
                  R$ {(10 * item.quantidadeSabor).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="text-muted-foreground">Total: </span>
            <span className="font-semibold text-lg">
              {pedido.totalPedidoUnidades} un. | R$ {calcularValorTotal().toFixed(2)}
            </span>
          </div>
          
          <div className="flex gap-2">
            {pedido.substatusPedido !== 'Separado' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCancelar?.(String(pedido.id))}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button 
                  onClick={() => onMarcarSeparado(String(pedido.id))}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar como Separado
                </Button>
              </>
            )}
            
            {pedido.substatusPedido === 'Separado' && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Separado
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
