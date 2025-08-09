
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { toast } from "sonner";

interface NovaEntregaManualModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NovaEntregaManualModal = ({ open, onOpenChange }: NovaEntregaManualModalProps) => {
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<"entrega" | "retorno">("entrega");
  const [quantidade, setQuantidade] = useState("");
  const [observacao, setObservacao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { adicionarRegistro } = useHistoricoEntregasStore();
  const { clientes } = useClienteStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clienteId || !quantidade) {
      toast.error("Cliente e quantidade são obrigatórios");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const novoRegistro = {
        cliente_id: clienteId,
        data: new Date(),
        tipo,
        quantidade: parseInt(quantidade),
        itens: [],
        observacao,
        status_anterior: "Manual",
        editado_manualmente: true
      };

      const registroId = await adicionarRegistro(novoRegistro);
      
      if (registroId) {
        toast.success(
          tipo === "entrega" 
            ? "Entrega manual registrada com sucesso" 
            : "Retorno manual registrado com sucesso"
        );
        
        // Limpar formulário
        setClienteId("");
        setTipo("entrega");
        setQuantidade("");
        setObservacao("");
        
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Erro ao registrar entrega manual:", error);
      toast.error("Erro ao registrar entrega manual");
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientesSorted = clientes
    .filter(c => c.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Entrega Manual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientesSorted.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(value: "entrega" | "retorno") => setTipo(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrega">Entrega</SelectItem>
                <SelectItem value="retorno">Retorno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Digite a quantidade"
            />
          </div>

          <div>
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Digite uma observação (opcional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !clienteId || !quantidade}
              className="flex-1"
            >
              {isSubmitting ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
