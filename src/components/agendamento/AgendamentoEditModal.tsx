
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgendamentoItem } from "./types";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useToast } from "@/hooks/use-toast";

interface AgendamentoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: AgendamentoItem | null;
  onSalvar: (agendamento: AgendamentoItem) => void;
}

export default function AgendamentoEditModal({
  open,
  onOpenChange,
  agendamento,
  onSalvar
}: AgendamentoEditModalProps) {
  const [dataReposicao, setDataReposicao] = useState<Date>();
  const [statusAgendamento, setStatusAgendamento] = useState<"Agendar" | "Previsto" | "Agendado">("Previsto");
  const [tipoPedido, setTipoPedido] = useState<"Padrão" | "Alterado">("Padrão");
  const [quantidadeTotal, setQuantidadeTotal] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");
  const { salvarAgendamento } = useAgendamentoClienteStore();
  const { toast } = useToast();

  useEffect(() => {
    if (agendamento) {
      setDataReposicao(agendamento.dataReposicao);
      setStatusAgendamento(agendamento.statusAgendamento);
      setTipoPedido(agendamento.pedido?.tipoPedido || "Padrão");
      setQuantidadeTotal(agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao);
      setObservacoes("");
    }
  }, [agendamento]);

  const handleSalvar = async () => {
    if (!agendamento || !dataReposicao) return;

    try {
      await salvarAgendamento(agendamento.cliente.id, {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: dataReposicao,
        tipo_pedido: tipoPedido,
        quantidade_total: quantidadeTotal
      });

      const agendamentoAtualizado: AgendamentoItem = {
        ...agendamento,
        dataReposicao,
        statusAgendamento,
        pedido: tipoPedido === "Alterado" ? {
          id: 0,
          idCliente: agendamento.cliente.id,
          dataPedido: new Date(),
          dataPrevistaEntrega: dataReposicao,
          statusPedido: 'Agendado',
          itensPedido: [],
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido
        } : undefined
      };

      onSalvar(agendamentoAtualizado);
      onOpenChange(false);

      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive"
      });
    }
  };

  if (!agendamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Editando agendamento para {agendamento.cliente.nome}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status do Agendamento</Label>
              <Select value={statusAgendamento} onValueChange={(value: "Agendar" | "Previsto" | "Agendado") => setStatusAgendamento(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendar">Agendar</SelectItem>
                  <SelectItem value="Previsto">Previsto</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoPedido">Tipo do Pedido</Label>
              <Select value={tipoPedido} onValueChange={(value: "Padrão" | "Alterado") => setTipoPedido(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padrão">Padrão</SelectItem>
                  <SelectItem value="Alterado">Alterado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Reposição</Label>
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
                  {dataReposicao ? format(dataReposicao, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataReposicao}
                  onSelect={setDataReposicao}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade Total</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidadeTotal}
              onChange={(e) => setQuantidadeTotal(Number(e.target.value))}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
