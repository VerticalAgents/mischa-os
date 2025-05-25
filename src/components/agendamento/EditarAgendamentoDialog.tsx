
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgendamentoItem } from "./types";

interface EditarAgendamentoDialogProps {
  agendamento: AgendamentoItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (agendamento: AgendamentoItem) => void;
}

export default function EditarAgendamentoDialog({ 
  agendamento, 
  open, 
  onOpenChange, 
  onSalvar 
}: EditarAgendamentoDialogProps) {
  const [dataReposicao, setDataReposicao] = useState(
    agendamento.dataReposicao.toISOString().split('T')[0]
  );
  const [quantidade, setQuantidade] = useState(
    (agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao).toString()
  );

  const handleSalvar = () => {
    const agendamentoAtualizado: AgendamentoItem = {
      ...agendamento,
      dataReposicao: new Date(dataReposicao),
      pedido: agendamento.pedido ? {
        ...agendamento.pedido,
        totalPedidoUnidades: parseInt(quantidade)
      } : undefined
    };

    onSalvar(agendamentoAtualizado);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Input id="cliente" value={agendamento.cliente.nome} disabled />
          </div>
          
          <div>
            <Label htmlFor="data">Data de Reposição</Label>
            <Input 
              id="data"
              type="date"
              value={dataReposicao}
              onChange={(e) => setDataReposicao(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input 
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
