import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, CreditCard } from "lucide-react";
import { useCartoes } from "@/hooks/useCartoes";
import { CartaoCredito } from "@/types/parcelamentos";
import { toast } from "sonner";

interface CartaoFormDialogProps {
  cartao?: CartaoCredito;
  trigger?: React.ReactNode;
}

export function CartaoFormDialog({ cartao, trigger }: CartaoFormDialogProps) {
  const [open, setOpen] = useState(false);
  const { createCartao, updateCartao } = useCartoes();
  
  const [formData, setFormData] = useState({
    nome: cartao?.nome || "",
    bandeira: cartao?.bandeira || "",
    ultimos_digitos: cartao?.ultimos_digitos || "",
    dia_vencimento: cartao?.dia_vencimento || 10,
    dia_fechamento: cartao?.dia_fechamento || 1,
    limite_credito: cartao?.limite_credito || 0,
    cor_identificacao: cartao?.cor_identificacao || "#D4A574",
    observacoes: cartao?.observacoes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (formData.nome.length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    if (formData.ultimos_digitos.length !== 4 || !/^\d{4}$/.test(formData.ultimos_digitos)) {
      toast.error("Últimos dígitos devem conter exatamente 4 números");
      return;
    }

    if (formData.dia_vencimento < 1 || formData.dia_vencimento > 31) {
      toast.error("Dia de vencimento deve estar entre 1 e 31");
      return;
    }

    if (formData.dia_fechamento < 1 || formData.dia_fechamento > 31) {
      toast.error("Dia de fechamento deve estar entre 1 e 31");
      return;
    }

    if (formData.limite_credito < 0) {
      toast.error("Limite de crédito não pode ser negativo");
      return;
    }

    if (cartao) {
      updateCartao({ id: cartao.id, ...formData });
    } else {
      createCartao({ ...formData, ativo: true });
    }

    setOpen(false);
    setFormData({
      nome: "",
      bandeira: "",
      ultimos_digitos: "",
      dia_vencimento: 10,
      dia_fechamento: 1,
      limite_credito: 0,
      cor_identificacao: "#D4A574",
      observacoes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Cartão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {cartao ? "Editar Cartão" : "Novo Cartão de Crédito"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do cartão de crédito para gerenciar seus parcelamentos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome do Cartão *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Cartão Pessoal"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="bandeira">Bandeira *</Label>
                <Input
                  id="bandeira"
                  value={formData.bandeira}
                  onChange={(e) => setFormData({ ...formData, bandeira: e.target.value })}
                  placeholder="Ex: Visa"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ultimos_digitos">Últimos 4 Dígitos *</Label>
                <Input
                  id="ultimos_digitos"
                  value={formData.ultimos_digitos}
                  onChange={(e) => setFormData({ ...formData, ultimos_digitos: e.target.value })}
                  placeholder="1234"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dia_fechamento">Dia Fechamento *</Label>
                <Input
                  id="dia_fechamento"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_fechamento}
                  onChange={(e) => setFormData({ ...formData, dia_fechamento: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dia_vencimento">Dia Vencimento *</Label>
                <Input
                  id="dia_vencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_vencimento}
                  onChange={(e) => setFormData({ ...formData, dia_vencimento: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="limite_credito">Limite de Crédito *</Label>
              <Input
                id="limite_credito"
                type="number"
                step="0.01"
                min="0"
                value={formData.limite_credito}
                onChange={(e) => setFormData({ ...formData, limite_credito: parseFloat(e.target.value) })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cor_identificacao">Cor de Identificação</Label>
              <div className="flex gap-2">
                <Input
                  id="cor_identificacao"
                  type="color"
                  value={formData.cor_identificacao}
                  onChange={(e) => setFormData({ ...formData, cor_identificacao: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.cor_identificacao}
                  onChange={(e) => setFormData({ ...formData, cor_identificacao: e.target.value })}
                  placeholder="#D4A574"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais sobre o cartão..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {cartao ? "Atualizar" : "Criar"} Cartão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
