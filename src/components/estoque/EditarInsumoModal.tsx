
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { InsumoSupabase } from "@/hooks/useSupabaseInsumos";

interface EditarInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  insumo: InsumoSupabase | null;
}

export default function EditarInsumoModal({ isOpen, onClose, insumo }: EditarInsumoModalProps) {
  const { atualizarInsumo } = useSupabaseInsumos();
  
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<"Matéria Prima" | "Embalagem" | "Outros">("Matéria Prima");
  const [volumeBruto, setVolumeBruto] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState<"g" | "kg" | "ml" | "l" | "un" | "pct">("g");
  const [custoMedio, setCustoMedio] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset form when insumo changes
  useEffect(() => {
    if (insumo) {
      setNome(insumo.nome || "");
      setCategoria(insumo.categoria || "Matéria Prima");
      setVolumeBruto(insumo.volume_bruto?.toString() || "");
      setUnidadeMedida(insumo.unidade_medida || "g");
      setCustoMedio(insumo.custo_medio?.toString() || "");
    } else {
      // Reset to default values when no insumo
      setNome("");
      setCategoria("Matéria Prima");
      setVolumeBruto("");
      setUnidadeMedida("g");
      setCustoMedio("");
    }
  }, [insumo]);

  const handleSalvar = async () => {
    if (!insumo) return;
    
    setLoading(true);
    try {
      const sucesso = await atualizarInsumo(insumo.id, {
        nome,
        categoria,
        volume_bruto: parseFloat(volumeBruto),
        unidade_medida: unidadeMedida,
        custo_medio: parseFloat(custoMedio)
      });

      if (sucesso) {
        onClose();
      }
    } catch (error) {
      console.error('Erro ao atualizar insumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaChange = (value: string) => {
    setCategoria(value as "Matéria Prima" | "Embalagem" | "Outros");
  };

  const handleUnidadeChange = (value: string) => {
    setUnidadeMedida(value as "g" | "kg" | "ml" | "l" | "un" | "pct");
  };

  // Don't render if no insumo is provided
  if (!insumo) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Insumo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do insumo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={handleCategoriaChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Matéria Prima">Matéria Prima</SelectItem>
                <SelectItem value="Embalagem">Embalagem</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="volume">Volume Bruto</Label>
              <Input
                id="volume"
                type="number"
                value={volumeBruto}
                onChange={(e) => setVolumeBruto(e.target.value)}
                placeholder="1000"
                step="0.01"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidade">Unidade de Medida</Label>
              <Select value={unidadeMedida} onValueChange={handleUnidadeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Gramas (g)</SelectItem>
                  <SelectItem value="kg">Kilos (kg)</SelectItem>
                  <SelectItem value="ml">Mililitros (ml)</SelectItem>
                  <SelectItem value="l">Litros (l)</SelectItem>
                  <SelectItem value="un">Unidades (un)</SelectItem>
                  <SelectItem value="pct">Pacotes (pct)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custo">Custo Médio (R$)</Label>
            <Input
              id="custo"
              type="number"
              value={custoMedio}
              onChange={(e) => setCustoMedio(e.target.value)}
              placeholder="4.10"
              step="0.01"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
