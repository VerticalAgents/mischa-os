import { Card } from "@/components/ui/card";
import { Truck, Package, Download, MapPin, RefreshCw } from "lucide-react";
import { useEditPermission } from "@/contexts/EditPermissionContext";
import { cn } from "@/lib/utils";

interface DespachoActionsCardProps {
  onDespacharEmMassa: () => void;
  onEntregarEmMassa: () => void;
  onDownloadCSV: () => void;
  onOtimizadorRota: () => void;
  onAtualizarDados: () => void;
  temPedidosSeparados: boolean;
  temPedidosDespachados: boolean;
  isLoading: boolean;
}

export const DespachoActionsCard = ({
  onDespacharEmMassa,
  onEntregarEmMassa,
  onDownloadCSV,
  onOtimizadorRota,
  onAtualizarDados,
  temPedidosSeparados,
  temPedidosDespachados,
  isLoading
}: DespachoActionsCardProps) => {
  const { canEdit } = useEditPermission();
  const mostrarAcoesDespacho = true;

  const itemBase =
    "group flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-medium rounded-lg transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-foreground/70";
  const itemIdle =
    "text-foreground/70 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10";
  const itemHighlighted =
    "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10";
  const iconBase = "h-4 w-4 shrink-0 transition-colors";

  return (
    <Card className="h-full overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-amber-500" />
          Ações
        </h3>
      </div>
      <div className="px-2 pb-4 space-y-0.5">
        {mostrarAcoesDespacho && canEdit && (
          <>
            <button
              type="button"
              onClick={onDespacharEmMassa}
              disabled={!temPedidosSeparados || isLoading}
              className={cn(itemBase, itemIdle)}
            >
              <Truck className={cn(iconBase, "text-muted-foreground group-hover:text-amber-500 group-disabled:text-muted-foreground")} strokeWidth={1.5} />
              Despachar em Massa
            </button>

            <button
              type="button"
              onClick={onEntregarEmMassa}
              disabled={!temPedidosDespachados || isLoading}
              className={cn(
                itemBase,
                temPedidosDespachados ? cn(itemHighlighted, "font-semibold") : itemIdle
              )}
            >
              <Package
                className={cn(
                  iconBase,
                  temPedidosDespachados
                    ? "text-amber-500"
                    : "text-muted-foreground group-hover:text-amber-500"
                )}
                strokeWidth={1.5}
              />
              Entregar em Massa
            </button>

            <button
              type="button"
              onClick={onDownloadCSV}
              disabled={isLoading}
              className={cn(itemBase, itemIdle)}
            >
              <Download className={cn(iconBase, "text-muted-foreground group-hover:text-amber-500")} strokeWidth={1.5} />
              Download CSV
            </button>

            <button
              type="button"
              onClick={onOtimizadorRota}
              disabled={isLoading}
              className={cn(itemBase, itemIdle)}
            >
              <MapPin className={cn(iconBase, "text-muted-foreground group-hover:text-amber-500")} strokeWidth={1.5} />
              Otimizador de Rota
            </button>

            <div className="py-2 px-3">
              <div className="h-px w-full bg-border/60" />
            </div>
          </>
        )}

        <button
          type="button"
          onClick={onAtualizarDados}
          disabled={isLoading}
          className={cn(itemBase, "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10")}
        >
          <RefreshCw
            className={cn(iconBase, "text-muted-foreground/70 group-hover:text-amber-500", isLoading && "animate-spin")}
            strokeWidth={1.5}
          />
          Atualizar
        </button>
      </div>
    </Card>
  );
};
