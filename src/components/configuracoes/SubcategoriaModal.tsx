
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubcategoriaCusto } from '@/hooks/useSupabaseSubcategoriasCustos';

interface SubcategoriaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (nome: string, tipo: 'fixo' | 'variavel') => Promise<boolean>;
  subcategoria?: SubcategoriaCusto | null;
  title: string;
}

export default function SubcategoriaModal({ 
  open, 
  onClose, 
  onSave, 
  subcategoria, 
  title 
}: SubcategoriaModalProps) {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'fixo' | 'variavel'>('fixo');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subcategoria) {
      setNome(subcategoria.nome);
      setTipo(subcategoria.tipo);
    } else {
      setNome('');
      setTipo('fixo');
    }
  }, [subcategoria, open]);

  const handleSave = async () => {
    if (!nome.trim()) {
      return;
    }

    setSaving(true);
    const success = await onSave(nome.trim(), tipo);
    
    if (success) {
      onClose();
      setNome('');
      setTipo('fixo');
    }
    setSaving(false);
  };

  const handleClose = () => {
    onClose();
    setNome('');
    setTipo('fixo');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Subcategoria</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite o nome da subcategoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(value: 'fixo' | 'variavel') => setTipo(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixo">Fixo</SelectItem>
                <SelectItem value="variavel">Variável</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!nome.trim() || saving}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
