
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Pedido } from "@/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, MapPin, User, Calendar, CheckCircle, Edit, Truck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import TipoPedidoBadge from "./TipoPedidoBadge";
import ProdutoNomeDisplay from "./ProdutoNomeDisplay";

interface PedidoCardProps {
  pedido: Pedido;
  onMarcarSeparado: (pedidoId: string) => void;
  onEditarAgendamento?: (pedidoId: string) => void;
  showAntecipada?: boolean;
  showDespachoActions?: boolean;
  onConfirmarDespacho?: () => void;
  onConfirmarEntrega?: (observacao?: string) => void;
  onConfirmarRetorno?: (observacao?: string) => void;
  onRetornarParaSeparacao?: () => void;
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

export default function PedidoCard({ 
  pedido, 
  onMarcarSeparado, 
  onEditarAgendamento, 
  showAntecipada,
  showDespachoActions = false,
  onConfirmarDespacho,
  onConfirmarEntrega,
  onConfirmarRetorno,
  onRetornarParaSeparacao
}: PedidoCardProps) {
  const formatarData = (data: Date) => {
    return format(new Date(data), "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  const calcularValorTotal = () => {
    // Using a default price since ItemPedido doesn't have precoUnitario
    return pedido.itensPedido.reduce((total, item) => total + (10 * item.quantidadeSabor), 0);
  };

  // Gerar ID do pedido apenas se for um número válido
  const getPedidoId = () => {
    const id = pedido.id;
    if (id && String(id).length > 0) {
      return `Pedido #${String(id).substring(0, 8)}`;
    }
    return "Pedido"; // Apenas "Pedido" sem o número se não for válido
  };

  const handleMarcarSeparado = () => {
    // Garantir que o ID está sendo passado como string
    const idString = String(pedido.id);
    console.log('✅ PedidoCard: Marcando como separado - ID original:', pedido.id, 'Tipo:', typeof pedido.id);
    console.log('✅ PedidoCard: ID convertido para string:', idString, 'Tipo:', typeof idString);
    onMarcarSeparado(idString);
  };

  const handleEditarAgendamento = () => {
    if (onEditarAgendamento) {
      const idString = String(pedido.id);
      console.log('🔧 PedidoCard: Editando agendamento - ID original:', pedido.id, 'Tipo:', typeof pedido.id);
      console.log('🔧 PedidoCard: ID convertido para string:', idString, 'Tipo:', typeof idString);
      onEditarAgendamento(idString);
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      pedido.substatusPedido === 'Separado' && "bg-green-50 border-green-200",
      showAntecipada && "border-blue-200 bg-blue-50"
    )}>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            {getPedidoId()}
            {showAntecipada && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                Separação Antecipada
              </Badge>
            )}
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
                    {item.nomeSabor || `Produto ${index}`}
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
            {/* Ações de separação (padrão) */}
            {!showDespachoActions && pedido.substatusPedido !== 'Separado' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditarAgendamento}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar Agendamento
                </Button>
                <Button 
                  onClick={handleMarcarSeparado}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Marcar como Separado
                </Button>
              </>
            )}

            {/* Ações de despacho */}
            {showDespachoActions && (
              <>
                {/* Botão para retornar à separação */}
                {onRetornarParaSeparacao && (
                  <Button 
                    onClick={onRetornarParaSeparacao}
                    size="sm"
                    variant="outline"
                    className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Retornar para Separação
                  </Button>
                )}

                {pedido.substatusPedido === 'Separado' && onConfirmarDespacho && (
                  <Button 
                    onClick={onConfirmarDespacho}
                    size="sm"
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Confirmar Despacho
                  </Button>
                )}
                
                {onConfirmarEntrega && (
                  <Button 
                    onClick={() => onConfirmarEntrega()}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Confirmar Entrega
                  </Button>
                )}
                
                {onConfirmarRetorno && (
                  <Button 
                    onClick={() => onConfirmarRetorno()}
                    size="sm"
                    variant="destructive"
                  >
                    Confirmar Retorno
                  </Button>
                )}
              </>
            )}
            
            {pedido.substatusPedido === 'Separado' && !showDespachoActions && (
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
