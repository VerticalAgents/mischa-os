
import React from "react";
import { Pedido, SubstatusPedidoAgendado } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/common/StatusBadge";
import { Check, Undo } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PedidosTableProps {
  pedidos: Pedido[];
  onConfirmSeparacao: (id: number) => void;
  onDesfazerSeparacao: (id: number) => void;
  showTipoPedido?: boolean;
}

const PedidosTable: React.FC<PedidosTableProps> = ({ 
  pedidos, 
  onConfirmSeparacao, 
  onDesfazerSeparacao, 
  showTipoPedido = false 
}) => {
  if (pedidos.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Não há pedidos para separação.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cliente</TableHead>
          {showTipoPedido && <TableHead>Tipo</TableHead>}
          {!showTipoPedido && <TableHead>Data Entrega</TableHead>}
          <TableHead>Total Unidades</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Sabores</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pedidos.map((pedido) => (
          <TableRow key={pedido.id}>
            <TableCell>{pedido.cliente?.nome || "Pedido Único"}</TableCell>
            
            {showTipoPedido ? (
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  pedido.tipoPedido === "Padrão" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {pedido.tipoPedido}
                </span>
              </TableCell>
            ) : (
              <TableCell>{formatDate(new Date(pedido.dataPrevistaEntrega))}</TableCell>
            )}
            
            <TableCell>{pedido.totalPedidoUnidades}</TableCell>
            <TableCell>
              <StatusBadge status={pedido.statusPedido} />
              {pedido.substatusPedido && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({pedido.substatusPedido})
                </span>
              )}
            </TableCell>
            <TableCell className="max-w-[300px] truncate">
              {pedido.itensPedido?.map(item => 
                `${item.nomeSabor || (item.sabor?.nome || "")}: ${item.quantidadeSabor}`
              ).join(", ")}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {pedido.substatusPedido === "Separado" ? (
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
                    onClick={() => onConfirmSeparacao(pedido.id)}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Confirmar Separação
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PedidosTable;
