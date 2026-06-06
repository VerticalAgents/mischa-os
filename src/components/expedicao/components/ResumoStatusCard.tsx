import { Card } from "@/components/ui/card";
import { Package, Truck } from "lucide-react";

interface PedidoExpedicao {
  id: string;
  cliente_nome: string;
  substatus_pedido?: string;
  quantidade_total: number;
  data_prevista_entrega: Date;
}

interface ResumoStatusCardProps {
  preset: 'hoje' | 'semana' | 'atrasados' | 'todos';
  pedidos: PedidoExpedicao[];
}

export const ResumoStatusCard = ({ preset, pedidos }: ResumoStatusCardProps) => {
  const pedidosSeparados = pedidos.filter(p => p.substatus_pedido === 'Separado');
  const pedidosDespachados = pedidos.filter(p => p.substatus_pedido === 'Despachado');
  
  const totalUnidades = pedidos.reduce((acc, p) => acc + (p.quantidade_total || 0), 0);
  const totalPedidos = pedidos.length;

  const titulo =
    preset === "hoje" ? "Entregas de Hoje"
    : preset === "semana" ? "Entregas da Semana"
    : preset === "atrasados" ? "Entregas Atrasadas"
    : "Todas as Entregas";

  return (
    <Card className="h-full border-border/60 shadow-none">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          {titulo}
        </h3>
      </div>
      <div className="px-4 pb-4 space-y-4">
        {/* Destaque do total */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            Quantidade Total
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl font-bold tabular-nums text-foreground">
              {totalUnidades}
            </p>
            <span className="text-xs text-muted-foreground">
              {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        </div>

        {/* Status separados/despachados */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-foreground/70">
              <Package className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[13px] font-medium">Separados</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {pedidosSeparados.length}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-foreground/70">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-[13px] font-medium">Despachados</span>
            </div>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {pedidosDespachados.length}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
