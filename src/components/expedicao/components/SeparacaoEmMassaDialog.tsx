import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PedidoExpedicao {
  id: string;
  cliente_nome: string;
  quantidade_total: number;
  data_prevista_entrega: Date;
  tipo_pedido: string;
  substatus_pedido?: string;
}

interface SeparacaoEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[];
  onConfirm: (pedidoIds: string[]) => Promise<void>;
}

export const SeparacaoEmMassaDialog = ({
  open,
  onOpenChange,
  pedidosDisponiveis,
  onConfirm,
}: SeparacaoEmMassaDialogProps) => {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  // Filtrar apenas pedidos 'Agendado' (prontos para separação)
  const pedidosElegiveis = pedidosDisponiveis.filter(
    (p) => !p.substatus_pedido || p.substatus_pedido === "Agendado"
  );

  // Resetar seleção quando o dialog abre
  useEffect(() => {
    if (open) {
      setSelecionados(new Set(pedidosElegiveis.map((p) => String(p.id))));
    }
  }, [open, pedidosElegiveis.length]);

  const toggleItem = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selecionados.size === pedidosElegiveis.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(pedidosElegiveis.map((p) => String(p.id))));
    }
  };

  const handleConfirm = async () => {
    if (selecionados.size === 0) return;
    setLoading(true);
    try {
      await onConfirm(Array.from(selecionados));
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const todosSelecionados = pedidosElegiveis.length > 0 && selecionados.size === pedidosElegiveis.length;
  const algumSelecionado = selecionados.size > 0 && selecionados.size < pedidosElegiveis.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Separar em Massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione os pedidos que deseja marcar como separados.
          </p>

          {pedidosElegiveis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Não há pedidos aguardando separação.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={todosSelecionados}
                    ref={(el) => {
                      if (el) {
                        (el as any).indeterminate = algumSelecionado;
                      }
                    }}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">Selecionar todos</span>
                </div>
                <Badge variant="secondary">
                  {selecionados.size} de {pedidosElegiveis.length} selecionados
                </Badge>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {pedidosElegiveis.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selecionados.has(String(pedido.id))}
                        onCheckedChange={() => toggleItem(String(pedido.id))}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{pedido.cliente_nome}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {pedido.quantidade_total} un
                          </span>
                          <span>
                            {format(new Date(pedido.data_prevista_entrega), "dd/MM", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {pedido.tipo_pedido}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || selecionados.size === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Confirmar ({selecionados.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
