
import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInsumoStore } from "@/hooks/useInsumoStore";
import { useToast } from "@/hooks/use-toast";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { ComponenteProduto } from "@/types";

interface InsumosModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  produtoId?: number;
  componente: ComponenteProduto | null;
}

export function InsumosModal({ open, setOpen, produtoId, componente }: InsumosModalProps) {
  const { toast } = useToast();
  const { insumos } = useInsumoStore();
  const { adicionarComponenteInsumo, atualizarComponente } = useProdutoStore();
  
  const [insumoSelecionado, setInsumoSelecionado] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  
  useEffect(() => {
    if (componente && componente.tipo === "Insumo" && componente.idItem) {
      setInsumoSelecionado(componente.idItem);
      setQuantidade(componente.quantidade);
    } else {
      setInsumoSelecionado(null);
      setQuantidade(1);
    }
  }, [componente]);
  
  const handleSave = () => {
    if (!insumoSelecionado || !produtoId) {
      toast({
        title: "Erro",
        description: "Selecione um insumo",
        variant: "destructive",
      });
      return;
    }
    
    if (componente) {
      // Editar componente existente
      atualizarComponente(produtoId, componente.id, quantidade);
      toast({
        title: "Componente Atualizado",
        description: "Componente atualizado com sucesso",
      });
    } else {
      // Adicionar novo componente
      adicionarComponenteInsumo(produtoId, insumoSelecionado, quantidade);
      toast({
        title: "Insumo Adicionado",
        description: "Insumo adicionado como componente com sucesso",
      });
    }
    
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{componente ? "Editar Componente" : "Adicionar Insumo como Componente"}</DialogTitle>
          <DialogDescription>
            {componente 
              ? "Edite as informações do componente selecionado." 
              : "Selecione um insumo para adicionar como componente do produto."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="insumo" className="text-right">
              Insumo
            </Label>
            <Select
              value={insumoSelecionado?.toString()}
              onValueChange={(value) => setInsumoSelecionado(parseInt(value))}
              disabled={!!componente}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione um insumo" />
              </SelectTrigger>
              <SelectContent>
                {insumos.map((insumo) => (
                  <SelectItem key={insumo.id} value={insumo.id.toString()}>
                    {insumo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantidade" className="text-right">
              Quantidade
            </Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              min={1}
              className="col-span-3"
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={handleSave}>Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
