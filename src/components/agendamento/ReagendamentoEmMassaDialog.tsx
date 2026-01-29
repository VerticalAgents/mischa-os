import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Package, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AgendamentoItem } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReagendamentoEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentosDisponiveis: AgendamentoItem[];
  onConfirm: (clienteIds: string[], novaData: Date) => Promise<void>;
}

export default function ReagendamentoEmMassaDialog({
  open,
  onOpenChange,
  agendamentosDisponiveis,
  onConfirm,
}: ReagendamentoEmMassaDialogProps) {
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Resetar seleção quando o dialog abre - todos selecionados por padrão
  useEffect(() => {
    if (open) {
      setSelecionados(new Set(agendamentosDisponiveis.map((a) => a.cliente.id)));
      setDataSelecionada(undefined);
    }
  }, [open, agendamentosDisponiveis]);

  const disableWeekends = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
  };

  const toggleItem = (clienteId: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(clienteId)) {
        next.delete(clienteId);
      } else {
        next.add(clienteId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selecionados.size === agendamentosDisponiveis.length) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(agendamentosDisponiveis.map((a) => a.cliente.id)));
    }
  };

  const handleConfirmar = async () => {
    if (!dataSelecionada || selecionados.size === 0) return;

    setIsLoading(true);
    try {
      await onConfirm(Array.from(selecionados), dataSelecionada);
      onOpenChange(false);
      setDataSelecionada(undefined);
      setSelecionados(new Set());
    } catch (error) {
      console.error('Erro ao reagendar em massa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setDataSelecionada(undefined);
    setSelecionados(new Set());
  };

  const todosSelecionados = agendamentosDisponiveis.length > 0 && selecionados.size === agendamentosDisponiveis.length;
  const algumSelecionado = selecionados.size > 0 && selecionados.size < agendamentosDisponiveis.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Reagendar em Massa
          </DialogTitle>
          <DialogDescription>
            Selecione os agendamentos e a nova data de reposição.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {agendamentosDisponiveis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Não há agendamentos disponíveis para reagendar.
            </div>
          ) : (
            <>
              {/* Header com Selecionar Todos e Contador */}
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
                  {selecionados.size} de {agendamentosDisponiveis.length} selecionados
                </Badge>
              </div>

              {/* Lista de Agendamentos com Checkboxes */}
              <ScrollArea className="h-[200px] pr-4">
                <div className="space-y-2">
                  {agendamentosDisponiveis.map((agendamento) => (
                    <div
                      key={agendamento.cliente.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selecionados.has(agendamento.cliente.id)}
                        onCheckedChange={() => toggleItem(agendamento.cliente.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{agendamento.cliente.nome}</div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0} un
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant={agendamento.statusAgendamento === "Agendado" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {agendamento.statusAgendamento}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Seleção de Nova Data */}
              <div>
                <p className="text-sm font-medium mb-2">Nova Data de Reposição:</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataSelecionada && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataSelecionada ? (
                        format(dataSelecionada, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataSelecionada}
                      onSelect={setDataSelecionada}
                      disabled={disableWeekends}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Os tipos de pedido, quantidades e itens personalizados serão preservados.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={!dataSelecionada || isLoading || selecionados.size === 0}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalendarIcon className="h-4 w-4 mr-2" />
            )}
            Confirmar ({selecionados.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
