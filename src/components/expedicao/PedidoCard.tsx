
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import { TipoPedidoBadge } from "./TipoPedidoBadge";
import { formatDate } from "@/lib/utils";
import { Check, Undo } from "lucide-react";

interface PedidoCardProps {
  pedido: {
    id: string;
    cliente_nome: string;
    data_prevista_entrega: Date;
    quantidade_total: number;
    tipo_pedido: string;
    substatus_pedido?: string;
    itens_personalizados?: any;
  };
  onConfirmarSeparacao: (id: string) => void;
  onDesfazerSeparacao: (id: string) => void;
  showAntecipada?: boolean;
}

export const PedidoCard = ({ 
  pedido, 
  onConfirmarSeparacao, 
  onDesfazerSeparacao,
  showAntecipada = false 
}: PedidoCardProps) => {
  // Processar lista de produtos/sabores
  const produtos = pedido.itens_personalizados || [];
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Informações principais do pedido */}
          <div className="flex-1">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-lg">{pedido.cliente_nome}</h3>
                <TipoPedidoBadge tipo={pedido.tipo_pedido} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Data:</span> {formatDate(new Date(pedido.data_prevista_entrega))}
                </div>
                <div>
                  <span className="font-medium">Status Agendamento:</span>
                  <StatusBadge status="Agendado" />
                </div>
                <div>
                  <span className="font-medium">Status Cliente:</span>
                  {pedido.substatus_pedido && (
                    <span className="ml-1 text-xs">
                      ({pedido.substatus_pedido})
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de produtos */}
          <div className="lg:w-80 border-l-0 lg:border-l lg:pl-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Produtos</h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {produtos.length > 0 ? (
                  produtos.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-left">{item.nome || item.sabor || `Produto ${index + 1}`}</span>
                      <span className="font-medium text-right ml-2">{item.quantidade || item.quantidade_sabor || 0}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Total: {pedido.quantidade_total} unidades
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col justify-center gap-2 lg:w-auto">
            {pedido.substatus_pedido === "Separado" ? (
              <Button
                variant="outline" 
                size="sm"
                onClick={() => onDesfazerSeparacao(pedido.id)}
                className="flex items-center gap-1"
              >
                <Undo className="h-4 w-4" />
                Desfazer
              </Button>
            ) : (
              <Button
                variant="outline" 
                size="sm"
                onClick={() => onConfirmarSeparacao(pedido.id)}
                className="flex items-center gap-1"
              >
                <Check className="h-4 w-4" />
                {showAntecipada ? "Separação Antecipada" : "Confirmar Separação"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
