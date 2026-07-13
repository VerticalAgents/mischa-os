
import { useState } from "react";
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
import { useClientesIndustriais } from "@/hooks/useClientesIndustriais";
import { Badge } from "@/components/ui/badge";

interface ReceitaInput {
  nome: string;
  descricao?: string;
  rendimento: number;
  unidade_rendimento: string;
  cliente_id: string | null;
}

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
  const { clientes: clientesPL } = useClientesIndustriais();
  const [tipoReceita, setTipoReceita] = useState<"MISCHAS" | "PL">("MISCHAS");
  const [formData, setFormData] = useState<ReceitaInput>({
    nome: "",
    descricao: "",
    rendimento: 1,
    unidade_rendimento: "unidades",
    cliente_id: null,
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

    if (tipoReceita === "PL" && !formData.cliente_id) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione o cliente Private-Label consignante",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obter o user_id do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('receitas_base')
        .insert({
          nome: formData.nome.trim(),
          descricao: formData.descricao?.trim() || null,
          rendimento: formData.rendimento,
          unidade_rendimento: formData.unidade_rendimento,
          user_id: user.id,
          cliente_id: tipoReceita === "PL" ? formData.cliente_id : null,
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
        cliente_id: null,
      });
      setTipoReceita("MISCHAS");

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
      cliente_id: null,
    });
    setTipoReceita("MISCHAS");
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
            <Label>Tipo de receita *</Label>
            <Select
              value={tipoReceita}
              onValueChange={(v) => {
                setTipoReceita(v as "MISCHAS" | "PL");
                if (v === "MISCHAS") {
                  setFormData((prev) => ({ ...prev, cliente_id: null }));
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MISCHAS">Mischa's (própria)</SelectItem>
                <SelectItem value="PL">Private-Label (cliente consignante)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoReceita === "PL" && (
            <div className="space-y-2">
              <Label htmlFor="cliente">
                Cliente consignante *
                <Badge variant="outline" className="ml-2 border-purple-400 text-purple-700">
                  PL
                </Badge>
              </Label>
              <Select
                value={formData.cliente_id ?? ""}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, cliente_id: v || null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente PL" />
                </SelectTrigger>
                <SelectContent>
                  {clientesPL.length === 0 && (
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Nenhum cliente industrial cadastrado
                    </div>
                  )}
                  {clientesPL.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nomeFantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Somente insumos consignados deste cliente poderão ser adicionados a esta receita.
              </p>
            </div>
          )}

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
