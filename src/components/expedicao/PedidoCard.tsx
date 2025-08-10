
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, Check, Edit, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import TipoPedidoBadge from "./TipoPedidoBadge";
import { PedidoDetalhes } from "./components/PedidoDetalhes";

interface PedidoCardData {
  id: string;
  cliente: {
    nome: string;
    endereco?: string;
    telefone?: string;
    linkGoogleMaps?: string;
  };
  dataEntrega: string;
  quantidadeTotal: number;
  tipoPedido: string;
  substatus?: string;
}

interface PedidoCardProps {
  pedido: PedidoCardData;
  onMarcarSeparado: () => void;
  onEditarAgendamento: () => void;
}

export default function PedidoCard({
  pedido,
  onMarcarSeparado,
  onEditarAgendamento,
}: PedidoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpansao = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{pedido.cliente.nome}</h3>
              <TipoPedidoBadge tipo={pedido.tipoPedido} />
            </div>
            {pedido.substatus && (
              <Badge variant="outline" className="text-xs">
                {pedido.substatus}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onEditarAgendamento}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <Button 
              onClick={onMarcarSeparado} 
              size="sm"
              className="flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Marcar Separado
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Data: {format(new Date(pedido.dataEntrega), "dd/MM/yyyy")}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Quantidade:</span>
            <Badge variant="secondary">{pedido.quantidadeTotal} unidades</Badge>
          </div>
        </div>

        {/* Endereço e contato */}
        {pedido.cliente.endereco && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <span>{pedido.cliente.endereco}</span>
              {pedido.cliente.linkGoogleMaps && (
                <a
                  href={pedido.cliente.linkGoogleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-3 w-3" />
                  Maps
                </a>
              )}
            </div>
          </div>
        )}

        {pedido.cliente.telefone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{pedido.cliente.telefone}</span>
          </div>
        )}

        {/* Detalhes dos produtos */}
        <PedidoDetalhes
          pedidoId={pedido.id}
          tipoPedido={pedido.tipoPedido}
          isExpanded={isExpanded}
          onToggle={toggleExpansao}
        />
      </CardContent>
    </Card>
  );
}
