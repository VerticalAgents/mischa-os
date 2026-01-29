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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Package, Loader2, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PedidoExpedicao {
  id: string | number;
  cliente_id: string | number;
  cliente_nome: string;
  substatus_pedido?: string;
  data_prevista_entrega?: string | Date;
  quantidade_total?: number;
  tipo_pedido?: string;
  itens_personalizados?: any;
}

interface EntregaEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pedidosDisponiveis: PedidoExpedicao[];
  onConfirm: (pedidoIds: string[], dataEntrega: Date) => Promise<void>;
}

export function EntregaEmMassaDialog({
  open,
  onOpenChange,
  pedidosDisponiveis,
  onConfirm
}: EntregaEmMassaDialogProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [dataEntrega, setDataEntrega] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Filtrar apenas pedidos "Despachado"
  const pedidosElegiveis = useMemo(() => {
    return pedidosDisponiveis.filter(p => p.substatus_pedido === 'Despachado');
  }, [pedidosDisponiveis]);

  // Inicializar seleção quando abre o modal
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      // Selecionar todos por padrão
      setSelecionados(new Set(pedidosElegiveis.map(p => String(p.id))));
      setDataEntrega(new Date());
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
      await onConfirm(Array.from(selecionados), dataEntrega);
      handleOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataPedido = (dataInput?: string | Date) => {
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
            <Package className="h-5 w-5" />
            Entregar em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione os pedidos e a data de entrega
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seletor de data */}
          <div className="space-y-2">
            <Label>Data de Entrega</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataEntrega && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataEntrega ? format(dataEntrega, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataEntrega}
                  onSelect={(date) => date && setDataEntrega(date)}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Header com select all */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all-entrega"
                checked={todosSelecionados}
                // @ts-ignore - indeterminate existe mas não está nos tipos
                data-state={algumSelecionado ? "indeterminate" : todosSelecionados ? "checked" : "unchecked"}
                onCheckedChange={toggleAll}
              />
              <label htmlFor="select-all-entrega" className="text-sm font-medium cursor-pointer">
                Selecionar todos
              </label>
            </div>
            <span className="text-sm text-muted-foreground">
              {selecionados.size} de {pedidosElegiveis.length} selecionados
            </span>
          </div>

          {/* Lista de pedidos */}
          <ScrollArea className="h-[250px] pr-4">
            {pedidosElegiveis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Não há pedidos despachados disponíveis para entrega.
              </div>
            ) : (
              <div className="space-y-2">
                {pedidosElegiveis.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`pedido-entrega-${pedido.id}`}
                      checked={selecionados.has(String(pedido.id))}
                      onCheckedChange={() => toggleItem(String(pedido.id))}
                    />
                    <label
                      htmlFor={`pedido-entrega-${pedido.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">{pedido.cliente_nome}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="text-green-600">Despachado</span>
                        <span>•</span>
                        <span>{pedido.quantidade_total} un</span>
                        {pedido.data_prevista_entrega && (
                          <>
                            <span>•</span>
                            <span>{formatarDataPedido(pedido.data_prevista_entrega)}</span>
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
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                Confirmar ({selecionados.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
