import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Truck, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PedidoExpedicao {
  id: string | number;
  cliente_nome: string;
  substatus_pedido?: string;
  data_prevista_entrega?: string | Date;
  quantidade_total?: number;
}

interface DespachoEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[];
  onConfirm: (pedidoIds: string[]) => Promise<void>;
}

export function DespachoEmMassaDialog({
  open,
  onOpenChange,
  pedidosDisponiveis,
  onConfirm
}: DespachoEmMassaDialogProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Filtrar apenas pedidos "Separado"
  const pedidosElegiveis = useMemo(() => {
    return pedidosDisponiveis.filter(p => p.substatus_pedido === 'Separado');
  }, [pedidosDisponiveis]);

  // Inicializar seleção quando abre o modal
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Selecionar todos por padrão
      setSelecionados(new Set(pedidosElegiveis.map(p => String(p.id))));
    } else {
      setSelecionados(new Set());
    }
    onOpenChange(isOpen);
  }, [pedidosElegiveis, onOpenChange]);

  const toggleItem = useCallback((id: string) => {
    setSelecionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selecionados.size === pedidosElegiveis.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(pedidosElegiveis.map(p => String(p.id))));
    }
  }, [pedidosElegiveis, selecionados.size]);

  const todosSelecionados = selecionados.size === pedidosElegiveis.length && pedidosElegiveis.length > 0;
  const algumSelecionado = selecionados.size > 0 && selecionados.size < pedidosElegiveis.length;

  const handleConfirm = async () => {
    if (selecionados.size === 0) return;
    
    setLoading(true);
    try {
      await onConfirm(Array.from(selecionados));
      handleOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (dataInput?: string | Date) => {
    if (!dataInput) return "";
    try {
      const date = typeof dataInput === 'string' ? parseISO(dataInput) : dataInput;
      return format(date, "dd/MM", { locale: ptBR });
    } catch {
      return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Despachar em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione os pedidos que deseja despachar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header com select all */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-despacho"
                checked={todosSelecionados}
                // @ts-ignore - indeterminate existe mas não está nos tipos
                data-state={algumSelecionado ? "indeterminate" : todosSelecionados ? "checked" : "unchecked"}
                onCheckedChange={toggleAll}
              />
              <label htmlFor="select-all-despacho" className="text-sm font-medium cursor-pointer">
                Selecionar todos
              </label>
            </div>
            <span className="text-sm text-muted-foreground">
              {selecionados.size} de {pedidosElegiveis.length} selecionados
            </span>
          </div>

          {/* Lista de pedidos */}
          <ScrollArea className="h-[300px] pr-4">
            {pedidosElegiveis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Não há pedidos separados disponíveis para despacho.
              </div>
            ) : (
              <div className="space-y-2">
                {pedidosElegiveis.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`pedido-despacho-${pedido.id}`}
                      checked={selecionados.has(String(pedido.id))}
                      onCheckedChange={() => toggleItem(String(pedido.id))}
                    />
                    <label
                      htmlFor={`pedido-despacho-${pedido.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{pedido.cliente_nome}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{pedido.quantidade_total} un</span>
                        {pedido.data_prevista_entrega && (
                          <>
                            <span>•</span>
                            <span>{formatarData(pedido.data_prevista_entrega)}</span>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selecionados.size === 0 || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Despachando...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" />
                Confirmar ({selecionados.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
