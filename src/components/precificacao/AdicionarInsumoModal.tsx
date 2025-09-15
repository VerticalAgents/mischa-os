import { useState } from "react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

interface AdicionarInsumoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdicionarInsumoModal({ isOpen, onClose }: AdicionarInsumoModalProps) {
  const { adicionarInsumo } = useSupabaseInsumos();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "" as "Matéria Prima" | "Embalagem" | "Outros" | "",
    volume_bruto: "",
    unidade_medida: "" as "g" | "kg" | "ml" | "l" | "un" | "pct" | "",
    custo_medio: "",
    estoque_atual: "0",
    estoque_minimo: "0"
  });

  const categorias: ("Matéria Prima" | "Embalagem" | "Outros")[] = ["Matéria Prima", "Embalagem", "Outros"];
  const unidadesMedida: ("g" | "kg" | "ml" | "l" | "un" | "pct")[] = ["g", "kg", "ml", "l", "un", "pct"];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.nome || !formData.categoria || !formData.volume_bruto || !formData.unidade_medida || !formData.custo_medio) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      await adicionarInsumo({
        nome: formData.nome,
        categoria: formData.categoria as "Matéria Prima" | "Embalagem" | "Outros",
        volume_bruto: parseFloat(formData.volume_bruto),
        unidade_medida: formData.unidade_medida as "g" | "kg" | "ml" | "l" | "un" | "pct",
        custo_medio: parseFloat(formData.custo_medio),
        estoque_atual: parseFloat(formData.estoque_atual) || 0,
        estoque_minimo: parseFloat(formData.estoque_minimo) || 0
      });
      
      toast.success("Insumo adicionado com sucesso!");
      onClose();
      
      // Limpar formulário
      setFormData({
        nome: "",
        categoria: "" as "Matéria Prima" | "Embalagem" | "Outros" | "",
        volume_bruto: "",
        unidade_medida: "" as "g" | "kg" | "ml" | "l" | "un" | "pct" | "",
        custo_medio: "",
        estoque_atual: "0",
        estoque_minimo: "0"
      });
    } catch (error) {
      console.error('Erro ao adicionar insumo:', error);
      toast.error("Erro ao adicionar insumo");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Insumo</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo insumo
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleInputChange("nome", e.target.value)}
              placeholder="Nome do insumo"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoria *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange("categoria", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((categoria) => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="volume_bruto">Volume Bruto *</Label>
              <Input
                id="volume_bruto"
                type="number"
                value={formData.volume_bruto}
                onChange={(e) => handleInputChange("volume_bruto", e.target.value)}
                placeholder="Ex: 1000"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unidade_medida">Unidade *</Label>
              <Select
                value={formData.unidade_medida}
                onValueChange={(value) => handleInputChange("unidade_medida", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidadesMedida.map((unidade) => (
                    <SelectItem key={unidade} value={unidade}>
                      {unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="custo_medio">Custo Médio (R$) *</Label>
            <Input
              id="custo_medio"
              type="number"
              step="0.01"
              value={formData.custo_medio}
              onChange={(e) => handleInputChange("custo_medio", e.target.value)}
              placeholder="Ex: 15.50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="estoque_atual">Estoque Atual</Label>
              <Input
                id="estoque_atual"
                type="number"
                value={formData.estoque_atual}
                onChange={(e) => handleInputChange("estoque_atual", e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                type="number"
                value={formData.estoque_minimo}
                onChange={(e) => handleInputChange("estoque_minimo", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvando..." : "Adicionar Insumo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}