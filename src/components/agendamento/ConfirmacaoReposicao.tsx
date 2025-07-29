
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { Cliente } from "@/types";
import { toast } from "sonner";

interface ConfirmacaoReposicaoProps {
  cliente: Cliente;
  onSuccess?: () => void;
}

export default function ConfirmacaoReposicao({ cliente, onSuccess }: ConfirmacaoReposicaoProps) {
  const { adicionarPedido } = usePedidoStore();
  const [open, setOpen] = useState(false);
  const [quantidade, setQuantidade] = useState(cliente.quantidadePadrao || 0);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirmar = async () => {
    try {
      setLoading(true);
      
      const novoPedido = {
        idCliente: cliente.id,
        clienteId: cliente.id,
        dataPedido: new Date(),
        dataPrevistaEntrega: new Date(),
        status: 'Pendente' as const,
        statusPedido: 'Pendente' as const,
        valorTotal: 0,
        observacoes,
        itensPedido: [],
        itens: [],
        enderecoEntrega: cliente.enderecoEntrega || '',
        contatoEntrega: cliente.contatoNome || '',
        numeroPedidoCliente: '',
        totalPedidoUnidades: quantidade,
        createdAt: new Date()
      };

      await adicionarPedido(novoPedido);
      
      toast.success('Pedido criado com sucesso!');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      toast.error('Erro ao criar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Confirmar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Reposição - {cliente.nome}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleConfirmar} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Pedido'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
