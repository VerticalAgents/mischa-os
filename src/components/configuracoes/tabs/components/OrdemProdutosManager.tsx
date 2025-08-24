
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { ProporcaoPadrao } from '@/hooks/useSupabaseProporoesPadrao';

interface OrdemProdutosManagerProps {
  proporcoes: ProporcaoPadrao[];
  onOrdemChange: (proporcoes: ProporcaoPadrao[]) => void;
}

export default function OrdemProdutosManager({ proporcoes, onOrdemChange }: OrdemProdutosManagerProps) {
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const moverProduto = (index: number, direcao: 'up' | 'down') => {
    const novaLista = [...proporcoes];
    const novoIndex = direcao === 'up' ? index - 1 : index + 1;
    
    if (novoIndex >= 0 && novoIndex < novaLista.length) {
      // Trocar posições
      [novaLista[index], novaLista[novoIndex]] = [novaLista[novoIndex], novaLista[index]];
      
      // Atualizar ordens
      novaLista.forEach((item, idx) => {
        item.ordem = idx + 1;
      });
      
      onOrdemChange(novaLista);
    }
  };

  const handleDragStart = (e: React.DragEvent, produtoId: string) => {
    setIsDragging(produtoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', produtoId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (!isDragging) return;
    
    const sourceIndex = proporcoes.findIndex(p => p.produto_id === isDragging);
    if (sourceIndex === -1 || sourceIndex === targetIndex) {
      setIsDragging(null);
      return;
    }

    const novaLista = [...proporcoes];
    const [itemMovido] = novaLista.splice(sourceIndex, 1);
    novaLista.splice(targetIndex, 0, itemMovido);
    
    // Atualizar ordens
    novaLista.forEach((item, idx) => {
      item.ordem = idx + 1;
    });
    
    onOrdemChange(novaLista);
    setIsDragging(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ordem dos Produtos</CardTitle>
        <p className="text-sm text-muted-foreground">
          Esta ordem será aplicada automaticamente nos agendamentos alterados.
          Arraste os produtos ou use as setas para reordená-los.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {proporcoes.map((proporcao, index) => (
            <div
              key={proporcao.produto_id}
              className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                isDragging === proporcao.produto_id ? 'bg-muted border-primary' : 'hover:bg-muted/50'
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, proporcao.produto_id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="text-sm font-medium text-muted-foreground w-8">
                  {index + 1}
                </span>
              </div>
              
              <div className="flex-1">
                <span className="font-medium">{proporcao.produto_nome}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moverProduto(index, 'up')}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => moverProduto(index, 'down')}
                  disabled={index === proporcoes.length - 1}
                >
                  <ArrowDown className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
