
import { useState } from "react";
import { useSupabaseReceitas, ReceitaInput } from "@/hooks/useSupabaseReceitas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CriarReceitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CriarReceitaModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarReceitaModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ReceitaInput>({
    nome: "",
    descricao: "",
    rendimento: 1,
    unidade_rendimento: "unidades",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "Nome da receita é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('receitas_base')
        .insert({
          nome: formData.nome.trim(),
          descricao: formData.descricao?.trim() || null,
          rendimento: formData.rendimento,
          unidade_rendimento: formData.unidade_rendimento,
        });

      if (error) {
        console.error('Erro ao criar receita:', error);
        toast({
          title: "Erro ao criar receita",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Receita criada",
        description: `${formData.nome} foi criada com sucesso`,
      });

      // Reset form
      setFormData({
        nome: "",
        descricao: "",
        rendimento: 1,
        unidade_rendimento: "unidades",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar receita:', error);
      toast({
        title: "Erro ao criar receita",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nome: "",
      descricao: "",
      rendimento: 1,
      unidade_rendimento: "unidades",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Receita</DialogTitle>
          <DialogDescription>
            Preencha os dados básicos da nova receita. Você poderá adicionar ingredientes depois.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Receita *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nome: e.target.value }))
              }
              placeholder="Ex: Massa de Pão Francês"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, descricao: e.target.value }))
              }
              placeholder="Descrição opcional da receita"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rendimento">Rendimento *</Label>
              <Input
                id="rendimento"
                type="number"
                min="0.1"
                step="0.1"
                value={formData.rendimento}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    rendimento: parseFloat(e.target.value) || 1,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade</Label>
              <Select
                value={formData.unidade_rendimento}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, unidade_rendimento: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidades">Unidades</SelectItem>
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="g">Gramas</SelectItem>
                  <SelectItem value="litros">Litros</SelectItem>
                  <SelectItem value="ml">ML</SelectItem>
                  <SelectItem value="formas">Formas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Receita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
