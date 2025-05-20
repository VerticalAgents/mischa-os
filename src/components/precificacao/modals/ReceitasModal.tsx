
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
import { useReceitaStore } from "@/hooks/useReceitaStore";
import { useToast } from "@/hooks/use-toast";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { ComponenteProduto, ReceitaBase } from "@/types";

interface ReceitasModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  produtoId?: number;
  componente: ComponenteProduto | null;
}

export function ReceitasModal({ open, setOpen, produtoId, componente }: ReceitasModalProps) {
  const { toast } = useToast();
  const { receitas } = useReceitaStore();
  const { adicionarComponenteReceita, atualizarComponente } = useProdutoStore();
  
  const [receitaSelecionada, setReceitaSelecionada] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState<number>(1);
  
  useEffect(() => {
    if (componente && componente.tipo === "Receita" && componente.idItem) {
      setReceitaSelecionada(componente.idItem);
      setQuantidade(componente.quantidade);
    } else {
      setReceitaSelecionada(null);
      setQuantidade(1);
    }
  }, [componente]);
  
  const handleSave = () => {
    if (!receitaSelecionada || !produtoId) {
      toast({
        title: "Erro",
        description: "Selecione uma receita",
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
      adicionarComponenteReceita(produtoId, receitaSelecionada, quantidade);
      toast({
        title: "Receita Adicionada",
        description: "Receita adicionada como componente com sucesso",
      });
    }
    
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{componente ? "Editar Componente" : "Adicionar Receita como Componente"}</DialogTitle>
          <DialogDescription>
            {componente 
              ? "Edite as informações do componente selecionado." 
              : "Selecione uma receita para adicionar como componente do produto."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="receita" className="text-right">
              Receita
            </Label>
            <Select
              value={receitaSelecionada?.toString()}
              onValueChange={(value) => setReceitaSelecionada(parseInt(value))}
              disabled={!!componente}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecione uma receita" />
              </SelectTrigger>
              <SelectContent>
                {receitas.map((receita) => (
                  <SelectItem key={receita.id} value={receita.id.toString()}>
                    {receita.nome}
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
