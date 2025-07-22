
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit, Check, X, RotateCcw } from 'lucide-react';
import { useSupabaseGirosSemanaPersonalizados } from '@/hooks/useSupabaseGirosSemanaPersonalizados';

interface GiroInlineEditorProps {
  clienteId: string;
  categoriaId: number;
  giroAtual: number;
  isPersonalizado: boolean;
  onGiroAtualizado: () => void;
}

export default function GiroInlineEditor({
  clienteId,
  categoriaId,
  giroAtual,
  isPersonalizado,
  onGiroAtualizado
}: GiroInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(giroAtual.toString());
  const { salvarGiroPersonalizado, removerGiroPersonalizado } = useSupabaseGirosSemanaPersonalizados();

  const iniciarEdicao = () => {
    setIsEditing(true);
    setEditValue(giroAtual.toString());
  };

  const cancelarEdicao = () => {
    setIsEditing(false);
    setEditValue(giroAtual.toString());
  };

  const salvarEdicao = async () => {
    const novoGiro = parseFloat(editValue);
    if (isNaN(novoGiro) || novoGiro < 0) {
      return;
    }

    const sucesso = await salvarGiroPersonalizado(clienteId, categoriaId, novoGiro);
    if (sucesso) {
      setIsEditing(false);
      onGiroAtualizado();
    }
  };

  const reverterParaAutomatico = async () => {
    const sucesso = await removerGiroPersonalizado(clienteId, categoriaId);
    if (sucesso) {
      onGiroAtualizado();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      salvarEdicao();
    } else if (e.key === 'Escape') {
      cancelarEdicao();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="w-20 h-8 text-xs text-right"
          min="0"
          step="0.1"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={salvarEdicao}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={cancelarEdicao}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono">
          {giroAtual % 1 === 0 ? giroAtual : giroAtual.toFixed(1)}
        </span>
        {isPersonalizado && (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
            Personalizado
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={iniciarEdicao}
        >
          <Edit className="h-4 w-4" />
        </Button>
        {isPersonalizado && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            onClick={reverterParaAutomatico}
            title="Reverter para cálculo automático"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
