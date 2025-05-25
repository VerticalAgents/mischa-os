
import { useState } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cliente, Pedido } from "@/types";
import { toast } from "@/hooks/use-toast";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface EditarAgendamentoDialogProps {
  agendamento: AgendamentoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (agendamentoAtualizado: AgendamentoItem) => void;
}

export default function EditarAgendamentoDialog({
  agendamento,
  open,
  onOpenChange,
  onSave,
}: EditarAgendamentoDialogProps) {
  const [dataReposicao, setDataReposicao] = useState<Date>(
    agendamento?.dataReposicao || new Date()
  );
  const [quantidade, setQuantidade] = useState(
    agendamento?.pedido?.totalPedidoUnidades || agendamento?.cliente.quantidadePadrao || 0
  );
  const [status, setStatus] = useState(agendamento?.statusAgendamento || "Previsto");
  const [observacoes, setObservacoes] = useState(
    agendamento?.pedido?.observacoes || ""
  );

  if (!agendamento) return null;

  const handleSave = () => {
    const agendamentoAtualizado: AgendamentoItem = {
      ...agendamento,
      dataReposicao,
      statusAgendamento: status,
      pedido: agendamento.pedido ? {
        ...agendamento.pedido,
        totalPedidoUnidades: quantidade,
        observacoes,
        dataPrevistaEntrega: dataReposicao.toISOString(),
      } : undefined,
    };

    onSave(agendamentoAtualizado);
    onOpenChange(false);
    
    toast({
      title: "Agendamento atualizado",
      description: `Alterações salvas para ${agendamento.cliente.nome}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input value={agendamento.cliente.nome} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input 
                value={agendamento.isPedidoUnico ? "Pedido Único" : "PDV"} 
                readOnly 
                className="bg-muted" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data da Reposição</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataReposicao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataReposicao ? format(dataReposicao, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataReposicao}
                  onSelect={(date) => date && setDataReposicao(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Quantidade</Label>
            <Input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Previsto">Previsto</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Reagendar">Reagendar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
