
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Cliente } from "@/hooks/useClientesSupabase";
import { Pedido } from "@/types/pedido";

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
  onSave: (agendamento: AgendamentoItem) => void;
}

export default function EditarAgendamentoDialog({ 
  agendamento, 
  open, 
  onOpenChange, 
  onSave 
}: EditarAgendamentoDialogProps) {
  const [formData, setFormData] = useState({
    dataReposicao: "",
    statusAgendamento: "",
    totalUnidades: 0,
    observacoes: "",
    tipoPedido: "Padrão"
  });

  useEffect(() => {
    if (agendamento) {
      setFormData({
        dataReposicao: format(agendamento.dataReposicao, 'yyyy-MM-dd'),
        statusAgendamento: agendamento.statusAgendamento,
        totalUnidades: agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidade_padrao || 0,
        observacoes: agendamento.pedido?.observacoes || "",
        tipoPedido: agendamento.pedido?.tipoPedido || "Padrão"
      });
    }
  }, [agendamento]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agendamento) return;

    const agendamentoAtualizado: AgendamentoItem = {
      ...agendamento,
      dataReposicao: new Date(formData.dataReposicao),
      statusAgendamento: formData.statusAgendamento,
      pedido: agendamento.pedido ? {
        ...agendamento.pedido,
        totalPedidoUnidades: formData.totalUnidades,
        observacoes: formData.observacoes,
        tipoPedido: formData.tipoPedido as "Padrão" | "Alterado" | "Único"
      } : undefined
    };

    onSave(agendamentoAtualizado);
    onOpenChange(false);
  };

  if (!agendamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              value={agendamento.cliente.nome}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataReposicao">Data da Reposição</Label>
            <Input
              id="dataReposicao"
              type="date"
              value={formData.dataReposicao}
              onChange={(e) => setFormData(prev => ({ ...prev, dataReposicao: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusAgendamento">Status</Label>
            <Select
              value={formData.statusAgendamento}
              onValueChange={(value) => setFormData(prev => ({ ...prev, statusAgendamento: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Previsto">Previsto</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Reagendar">Reagendar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!agendamento.isPedidoUnico && (
            <>
              <div className="space-y-2">
                <Label htmlFor="totalUnidades">Quantidade (unidades)</Label>
                <Input
                  id="totalUnidades"
                  type="number"
                  min="0"
                  value={formData.totalUnidades}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalUnidades: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoPedido">Tipo de Pedido</Label>
                <Select
                  value={formData.tipoPedido}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipoPedido: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Padrão">Padrão</SelectItem>
                    <SelectItem value="Alterado">Alterado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Digite observações sobre o agendamento..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
