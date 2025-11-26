import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { AgendamentoItem } from "./types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReagendamentoEmMassaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamentosSelecionados: AgendamentoItem[];
  onConfirm: (novaData: Date) => Promise<void>;
}

export default function ReagendamentoEmMassaDialog({
  open,
  onOpenChange,
  agendamentosSelecionados,
  onConfirm,
}: ReagendamentoEmMassaDialogProps) {
  const [dataSelecionada, setDataSelecionada] = useState<Date | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const disableWeekends = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
  };

  const handleConfirmar = async () => {
    if (!dataSelecionada) return;

    setIsLoading(true);
    try {
      await onConfirm(dataSelecionada);
      onOpenChange(false);
      setDataSelecionada(undefined);
    } catch (error) {
      console.error('Erro ao reagendar em massa:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setDataSelecionada(undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reagendar Agendamentos em Massa</DialogTitle>
          <DialogDescription>
            Selecione a nova data de reposição para os agendamentos selecionados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm font-medium mb-2">
              Você está reagendando {agendamentosSelecionados.length} agendamento(s):
            </p>
            <ScrollArea className="h-[120px] rounded-md border p-3">
              <ul className="space-y-1">
                {agendamentosSelecionados.map((agendamento) => (
                  <li key={agendamento.cliente.id} className="text-sm">
                    • {agendamento.cliente.nome}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={!dataSelecionada || isLoading}
          >
            {isLoading ? "Reagendando..." : "Confirmar Reagendamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
