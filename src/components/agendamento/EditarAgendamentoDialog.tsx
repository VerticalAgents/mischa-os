
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
  // Handle both agendamento structure and expedição pedido structure
  const getDataReposicao = () => {
    if (agendamento.dataReposicao) {
      return agendamento.dataReposicao.toISOString().split('T')[0];
    }
    // Fallback for expedição structure
    if ((agendamento as any).data_prevista_entrega) {
      const date = new Date((agendamento as any).data_prevista_entrega);
      return date.toISOString().split('T')[0];
    }
    // Default to today
    return new Date().toISOString().split('T')[0];
  };

  const getQuantidade = () => {
    if (agendamento.pedido?.totalPedidoUnidades) {
      return agendamento.pedido.totalPedidoUnidades.toString();
    }
    // Fallback for expedição structure
    if ((agendamento as any).quantidade_total) {
      return (agendamento as any).quantidade_total.toString();
    }
    // Fallback to cliente default if available
    if (agendamento.cliente?.quantidadePadrao) {
      return agendamento.cliente.quantidadePadrao.toString();
    }
    // Default fallback
    return "0";
  };

  const getClienteNome = () => {
    // Try standard structure first
    if (agendamento.cliente?.nome) {
      return agendamento.cliente.nome;
    }
    // Fallback for expedição structure
    if ((agendamento as any).cliente_nome) {
      return (agendamento as any).cliente_nome;
    }
    // Default fallback
    return "Cliente não identificado";
  };

  const [dataReposicao, setDataReposicao] = useState(getDataReposicao());
  const [quantidade, setQuantidade] = useState(getQuantidade());

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
            <Input id="cliente" value={getClienteNome()} disabled />
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
