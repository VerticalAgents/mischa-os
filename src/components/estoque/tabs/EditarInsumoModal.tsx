
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseInsumos, InsumoSupabase } from "@/hooks/useSupabaseInsumos";
import { CategoriaInsumo, UnidadeMedida } from "@/types/insumos";

interface EditarInsumoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  insumo: InsumoSupabase | null;
}

export default function EditarInsumoModal({ open, onOpenChange, insumo }: EditarInsumoModalProps) {
  const { atualizarInsumo } = useSupabaseInsumos();
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "Matéria Prima" as CategoriaInsumo,
    volume_bruto: 0,
    unidade_medida: "g" as UnidadeMedida,
    custo_medio: 0,
    estoque_minimo: 0,
    estoque_ideal: 0,
  });

  useEffect(() => {
    if (insumo) {
      setFormData({
        nome: insumo.nome,
        categoria: insumo.categoria,
        volume_bruto: insumo.volume_bruto,
        unidade_medida: insumo.unidade_medida,
        custo_medio: insumo.custo_medio,
        estoque_minimo: insumo.estoque_minimo || 0,
        estoque_ideal: insumo.estoque_ideal || 0,
      });
    }
  }, [insumo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!insumo) return;

    const sucesso = await atualizarInsumo(insumo.id, formData);
    if (sucesso) {
      onOpenChange(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Insumo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="categoria">Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange('categoria', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Matéria Prima">Matéria Prima</SelectItem>
                <SelectItem value="Embalagem">Embalagem</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="volume_bruto">Volume Bruto</Label>
              <Input
                id="volume_bruto"
                type="number"
                step="0.01"
                value={formData.volume_bruto}
                onChange={(e) => handleInputChange('volume_bruto', parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div>
              <Label htmlFor="unidade_medida">Unidade de Medida</Label>
              <Select
                value={formData.unidade_medida}
                onValueChange={(value) => handleInputChange('unidade_medida', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Gramas (g)</SelectItem>
                  <SelectItem value="kg">Quilogramas (kg)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="l">Litros (l)</SelectItem>
                  <SelectItem value="un">Unidades (un)</SelectItem>
                  <SelectItem value="pct">Pacotes (pct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="custo_medio">Custo Médio (R$)</Label>
            <Input
              id="custo_medio"
              type="number"
              step="0.01"
              value={formData.custo_medio}
              onChange={(e) => handleInputChange('custo_medio', parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                step="0.01"
                value={formData.estoque_minimo}
                onChange={(e) => handleInputChange('estoque_minimo', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="estoque_ideal">Estoque Ideal</Label>
              <Input
                id="estoque_ideal"
                type="number"
                step="0.01"
                value={formData.estoque_ideal}
                onChange={(e) => handleInputChange('estoque_ideal', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
