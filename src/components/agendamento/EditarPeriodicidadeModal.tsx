import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClienteStore } from "@/hooks/useClienteStore";
import { Cliente } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditarPeriodicidadeModalProps {
  cliente: Cliente;
  periodicidadeAtual: number;
  quantidadeAtual: number;
  open: boolean;
  onClose: () => void;
}

export default function EditarPeriodicidadeModal({
  cliente,
  periodicidadeAtual,
  quantidadeAtual,
  open,
  onClose,
}: EditarPeriodicidadeModalProps) {
  const { atualizarCliente } = useClienteStore();
  
  const [periodicidade, setPeriodicidade] = useState(periodicidadeAtual);
  const [quantidade, setQuantidade] = useState(quantidadeAtual);
  const [salvando, setSalvando] = useState(false);

  const handleSalvar = async () => {
    if (periodicidade < 1) {
      toast.error("Periodicidade deve ser no mínimo 1 dia");
      return;
    }
    if (quantidade < 0) {
      toast.error("Quantidade não pode ser negativa");
      return;
    }

    setSalvando(true);
    try {
      await atualizarCliente(cliente.id, {
        ...cliente,
        periodicidadePadrao: periodicidade,
        quantidadePadrao: quantidade,
      });
      toast.success("Periodicidade atualizada com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar periodicidade:", error);
      toast.error("Erro ao atualizar periodicidade");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Periodicidade</DialogTitle>
          <DialogDescription>
            Altere a periodicidade e quantidade padrão para <strong>{cliente.nome}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="periodicidade" className="text-right">
              Periodicidade
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="periodicidade"
                type="number"
                min={1}
                value={periodicidade}
                onChange={(e) => setPeriodicidade(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">dias</span>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantidade" className="text-right">
              Qtd Padrão
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="quantidade"
                type="number"
                min={0}
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">unidades</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={salvando}>
            {salvando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
