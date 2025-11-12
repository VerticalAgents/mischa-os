import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useParcelamentos } from "@/hooks/useParcelamentos";
import { useCartoes } from "@/hooks/useCartoes";
import { useTiposParcelamento } from "@/hooks/useTiposParcelamento";

export function NovoParcelamentoDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    tipo_parcelamento_id: "",
    cartao_id: "",
    descricao: "",
    valor_total: "",
    numero_parcelas: "",
    data_compra: new Date().toISOString().split('T')[0],
    observacoes: "",
  });

  const { createParcelamento } = useParcelamentos();
  const { cartoes } = useCartoes();
  const { tipos } = useTiposParcelamento();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createParcelamento({
      ...formData,
      valor_total: Number(formData.valor_total),
      numero_parcelas: Number(formData.numero_parcelas),
      status: 'ativo',
    });

    setOpen(false);
    setFormData({
      tipo_parcelamento_id: "",
      cartao_id: "",
      descricao: "",
      valor_total: "",
      numero_parcelas: "",
      data_compra: new Date().toISOString().split('T')[0],
      observacoes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Parcelamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Parcelamento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Parcelamento</Label>
              <Select
                value={formData.tipo_parcelamento_id}
                onValueChange={(value) => setFormData({ ...formData, tipo_parcelamento_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cartao">Cartão de Crédito</Label>
              <Select
                value={formData.cartao_id}
                onValueChange={(value) => setFormData({ ...formData, cartao_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cartoes.map((cartao) => (
                    <SelectItem key={cartao.id} value={cartao.id}>
                      {cartao.nome} - {cartao.bandeira}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Ex: Notebook Dell"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor_total">Valor Total</Label>
              <Input
                id="valor_total"
                type="number"
                step="0.01"
                value={formData.valor_total}
                onChange={(e) => setFormData({ ...formData, valor_total: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_parcelas">Número de Parcelas</Label>
              <Input
                id="numero_parcelas"
                type="number"
                min="1"
                value={formData.numero_parcelas}
                onChange={(e) => setFormData({ ...formData, numero_parcelas: e.target.value })}
                placeholder="12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_compra">Data da Compra</Label>
              <Input
                id="data_compra"
                type="date"
                value={formData.data_compra}
                onChange={(e) => setFormData({ ...formData, data_compra: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Parcelamento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
