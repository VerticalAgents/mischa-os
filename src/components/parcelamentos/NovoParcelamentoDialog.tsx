import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, AlertCircle, CheckCircle2, CreditCard } from "lucide-react";
import { useParcelamentos } from "@/hooks/useParcelamentos";
import { useTiposParcelamento } from "@/hooks/useTiposParcelamento";
import { useCartoes } from "@/hooks/useCartoes";
import { useCartaoLimites } from "@/hooks/useCartaoLimites";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function NovoParcelamentoDialog() {
  const [open, setOpen] = useState(false);
  const { createParcelamento } = useParcelamentos();
  const { tipos, isLoading: loadingTipos } = useTiposParcelamento();
  const { cartoes, isLoading: loadingCartoes } = useCartoes();

  const [formData, setFormData] = useState({
    tipo_parcelamento_id: "",
    cartao_id: "",
    descricao: "",
    valor_total: "",
    numero_parcelas: "",
    data_compra: new Date().toISOString().split("T")[0],
    observacoes: "",
  });

  const { data: limites } = useCartaoLimites(formData.cartao_id || null);
  const cartaoSelecionado = cartoes.find(c => c.id === formData.cartao_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const valorTotal = parseFloat(formData.valor_total);

    // Validação: valor mínimo R$ 1,00
    if (valorTotal < 1) {
      toast.error("O valor total deve ser maior ou igual a R$ 1,00");
      return;
    }

    // Validação: campos obrigatórios
    if (!formData.tipo_parcelamento_id || !formData.cartao_id || !formData.descricao || 
        !formData.numero_parcelas || !formData.data_compra) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Validação: limite disponível
    if (limites && valorTotal > limites.limiteDisponivel) {
      toast.error(`O valor excede o limite disponível de R$ ${limites.limiteDisponivel.toFixed(2)}`);
      return;
    }

    createParcelamento({
      tipo_parcelamento_id: formData.tipo_parcelamento_id,
      cartao_id: formData.cartao_id,
      descricao: formData.descricao,
      valor_total: valorTotal,
      numero_parcelas: parseInt(formData.numero_parcelas),
      data_compra: formData.data_compra,
      status: "ativo",
      observacoes: formData.observacoes || undefined,
    });

    setOpen(false);
    setFormData({
      tipo_parcelamento_id: "",
      cartao_id: "",
      descricao: "",
      valor_total: "",
      numero_parcelas: "",
      data_compra: new Date().toISOString().split("T")[0],
      observacoes: "",
    });
  };

  const valorTotal = parseFloat(formData.valor_total) || 0;
  const dentrodoLimite = limites ? valorTotal <= limites.limiteDisponivel : true;
  const canSubmit = dentrodoLimite && valorTotal >= 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Parcelamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Parcelamento</DialogTitle>
          <DialogDescription>
            Registre um novo parcelamento de compra no cartão de crédito
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo de Parcelamento *</Label>
              <Select
                value={formData.tipo_parcelamento_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, tipo_parcelamento_id: value })
                }
                disabled={loadingTipos}
                required
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

            <div className="grid gap-2">
              <Label htmlFor="cartao">Cartão de Crédito *</Label>
              <Select
                value={formData.cartao_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, cartao_id: value })
                }
                disabled={loadingCartoes}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cartão" />
                </SelectTrigger>
                <SelectContent>
                  {cartoes.map((cartao) => (
                    <SelectItem key={cartao.id} value={cartao.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cartao.cor_identificacao }}
                        />
                        {cartao.nome} - {cartao.bandeira} ••••{cartao.ultimos_digitos}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Card de Status do Cartão */}
            {cartaoSelecionado && limites && (
              <Card className={dentrodoLimite ? "border-green-500/50" : "border-destructive/50"}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <div>
                        <p className="font-medium text-sm">
                          {cartaoSelecionado.nome} ••••{cartaoSelecionado.ultimos_digitos}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Limite: R$ {limites.limiteTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {dentrodoLimite ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <CheckCircle2 className="h-4 w-4" />
                        Dentro do limite
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4" />
                        Excede o limite
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Comprometido: R$ {limites.valorComprometido.toFixed(2)}</span>
                      <span className="font-medium">
                        Disponível: R$ {limites.limiteDisponivel.toFixed(2)}
                      </span>
                    </div>
                    <Progress
                      value={limites.percentualUtilizado}
                      className={`h-2 ${
                        limites.percentualUtilizado > 90
                          ? "bg-destructive/20"
                          : limites.percentualUtilizado > 70
                          ? "bg-yellow-500/20"
                          : "bg-green-500/20"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {limites.percentualUtilizado.toFixed(1)}% utilizado
                      {valorTotal > 0 && ` → ${((limites.valorComprometido + valorTotal) / limites.limiteTotal * 100).toFixed(1)}% após esta compra`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Ex: Notebook Dell"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="valor_total">Valor Total * (mín. R$ 1,00)</Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  min="1"
                  value={formData.valor_total}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_total: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="numero_parcelas">Número de Parcelas *</Label>
                <Input
                  id="numero_parcelas"
                  type="number"
                  min="1"
                  value={formData.numero_parcelas}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_parcelas: e.target.value })
                  }
                  placeholder="12"
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="data_compra">Data da Compra *</Label>
              <Input
                id="data_compra"
                type="date"
                value={formData.data_compra}
                onChange={(e) =>
                  setFormData({ ...formData, data_compra: e.target.value })
                }
                required
              />
            </div>

            {dataVencimentoSugerida && cartaoSelecionado && (
              <div className="grid gap-2">
                <Label htmlFor="primeira_data_vencimento">
                  Data de Vencimento da 1ª Parcela
                </Label>
                <Input
                  id="primeira_data_vencimento"
                  type="date"
                  value={primeiraDataVencimento}
                  onChange={(e) => setPrimeiraDataVencimento(e.target.value)}
                  disabled={calculandoData}
                  className="font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  {primeiraDataVencimento !== dataVencimentoSugerida && (
                    <span className="text-amber-600">⚠ Data personalizada. </span>
                  )}
                  As demais parcelas vencerão sempre no dia {cartaoSelecionado.dia_vencimento} dos meses seguintes
                  {cartaoSelecionado.dia_vencimento > 28 && " (ajustado ao último dia quando necessário)"}.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Informações adicionais..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Criar Parcelamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
