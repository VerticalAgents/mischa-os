import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Printer, Loader2, Package, Send } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PedidoImpressao {
  id: string;
  cliente_id?: string;
  cliente_nome: string;
  quantidade_total: number;
  data_prevista_entrega: Date | string;
  tipo_pedido?: string;
  gestaoclick_venda_id?: string;
}

interface SelecaoPedidosImpressaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidos: PedidoImpressao[];
  tipoLista: string;
  onConfirm: (pedidosSelecionados: PedidoImpressao[], gerarVendasGC: boolean) => Promise<void> | void;
  /** Quando omitido, o toggle de gerar vendas no GC não é exibido */
  podeGerarVendasGC?: boolean;
}

export const SelecaoPedidosImpressaoDialog = ({
  open,
  onOpenChange,
  pedidos,
  tipoLista,
  onConfirm,
  podeGerarVendasGC = false,
}: SelecaoPedidosImpressaoDialogProps) => {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [gerarVendasGC, setGerarVendasGC] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelecionados(new Set(pedidos.map((p) => String(p.id))));
      setGerarVendasGC(false);
    }
  }, [open, pedidos]);

  const toggleItem = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selecionados.size === pedidos.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(pedidos.map((p) => String(p.id))));
    }
  };

  const pedidosSelecionados = useMemo(
    () => pedidos.filter((p) => selecionados.has(String(p.id))),
    [pedidos, selecionados]
  );

  const semVendaGCCount = useMemo(
    () => pedidosSelecionados.filter((p) => !p.gestaoclick_venda_id).length,
    [pedidosSelecionados]
  );

  const todosJaTemVenda = podeGerarVendasGC && pedidosSelecionados.length > 0 && semVendaGCCount === 0;
  const todosSelecionados = pedidos.length > 0 && selecionados.size === pedidos.length;
  const algumSelecionado = selecionados.size > 0 && selecionados.size < pedidos.length;

  const handleConfirm = async () => {
    if (pedidosSelecionados.length === 0) return;
    setLoading(true);
    try {
      await onConfirm(pedidosSelecionados, gerarVendasGC && podeGerarVendasGC && semVendaGCCount > 0);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const labelBotao =
    gerarVendasGC && podeGerarVendasGC && semVendaGCCount > 0
      ? `Gerar vendas e imprimir (${pedidosSelecionados.length})`
      : `Imprimir lista (${pedidosSelecionados.length})`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-amber-600" />
            Lista de Separação — {tipoLista}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione os pedidos que entrarão na lista. Por padrão todos estão marcados — desmarque os que quiser deixar de fora.
          </p>

          {pedidos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Não há pedidos disponíveis nesta lista.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={todosSelecionados}
                    ref={(el) => {
                      if (el) (el as any).indeterminate = algumSelecionado;
                    }}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm font-medium">Selecionar todos</span>
                </div>
                <Badge variant="secondary">
                  {selecionados.size} de {pedidos.length} selecionados
                </Badge>
              </div>

              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {pedidos.map((pedido) => {
                    const id = String(pedido.id);
                    const temVendaGC = !!pedido.gestaoclick_venda_id;
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={selecionados.has(id)}
                          onCheckedChange={() => toggleItem(id)}
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
                            {podeGerarVendasGC && temVendaGC && (
                              <span className="text-emerald-600">• venda GC ✓</span>
                            )}
                          </div>
                        </div>
                        {pedido.tipo_pedido && (
                          <Badge variant="outline" className="text-xs">
                            {pedido.tipo_pedido}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {podeGerarVendasGC && (
                <div className="rounded-lg border bg-muted/30 p-3 flex items-start gap-3">
                  <Switch
                    checked={gerarVendasGC && semVendaGCCount > 0}
                    onCheckedChange={setGerarVendasGC}
                    disabled={todosJaTemVenda}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium flex items-center gap-2">
                      <Send className="h-3.5 w-3.5 text-amber-600" />
                      Gerar vendas no GestãoClick ao imprimir
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {todosJaTemVenda
                        ? "Todos os pedidos selecionados já possuem venda gerada."
                        : gerarVendasGC
                          ? `${semVendaGCCount} pedido(s) sem venda GC serão gerados antes da impressão.`
                          : `${semVendaGCCount} pedido(s) selecionado(s) ainda não têm venda no GestãoClick.`}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || pedidosSelecionados.length === 0}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            {labelBotao}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
