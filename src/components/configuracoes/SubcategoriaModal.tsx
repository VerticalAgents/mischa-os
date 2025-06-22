
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SubcategoriaCusto } from '@/hooks/useSupabaseSubcategoriasCustos';

interface SubcategoriaModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (nome: string, tipo: 'fixo' | 'variavel') => Promise<boolean>;
  subcategoria?: SubcategoriaCusto | null;
  tipoFixo: 'fixo' | 'variavel';
  title: string;
}

export default function SubcategoriaModal({ 
  open, 
  onClose, 
  onSave, 
  subcategoria, 
  tipoFixo,
  title 
}: SubcategoriaModalProps) {
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (subcategoria) {
      setNome(subcategoria.nome);
    } else {
      setNome('');
    }
  }, [subcategoria, open]);

  const handleSave = async () => {
    if (!nome.trim()) {
      return;
    }

    setSaving(true);
    const success = await onSave(nome.trim(), tipoFixo);
    
    if (success) {
      onClose();
      setNome('');
    }
    setSaving(false);
  };

  const handleClose = () => {
    onClose();
    setNome('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nome.trim() && !saving) {
      handleSave();
    }
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
              onKeyDown={handleKeyDown}
              placeholder="Digite o nome da subcategoria"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Custo</Label>
            <div className="flex items-center gap-2">
              <Badge variant={tipoFixo === 'fixo' ? 'default' : 'secondary'}>
                {tipoFixo === 'fixo' ? 'Custo Fixo' : 'Custo Variável'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {tipoFixo === 'fixo' 
                  ? '(Valores que não variam com a produção)' 
                  : '(Valores que variam conforme a produção/vendas)'
                }
              </span>
            </div>
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
