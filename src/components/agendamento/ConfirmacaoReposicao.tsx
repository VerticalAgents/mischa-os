
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { Cliente } from "@/types";
import { toast } from "sonner";

interface ConfirmacaoReposicaoProps {
  cliente?: Cliente;
  onClose?: () => void;
}

export default function ConfirmacaoReposicao({ cliente, onClose }: ConfirmacaoReposicaoProps) {
  const [quantidade, setQuantidade] = useState(cliente?.quantidadePadrao?.toString() || "0");
  const [observacoes, setObservacoes] = useState("");
  const { criarNovoPedido } = usePedidoStore();

  const handleConfirmar = () => {
    if (!cliente) {
      toast.error("Nenhum cliente selecionado");
      return;
    }

    const pedido = criarNovoPedido(cliente.id);
    
    if (pedido) {
      toast.success("Reposição confirmada com sucesso!");
      onClose?.();
    }
  };

  if (!cliente) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Selecione um cliente para confirmar a reposição</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Confirmar Reposição</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="cliente">Cliente</Label>
          <Input id="cliente" value={cliente.nome} disabled />
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
        
        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea 
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Observações sobre a reposição..."
          />
        </div>
        
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>
            Confirmar Reposição
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
