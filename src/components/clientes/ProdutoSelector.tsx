
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useProdutoStore } from '@/hooks/useProdutoStore';

interface ProdutoQuantidade {
  produto: string;
  quantidade: number;
}

interface ProdutoSelectorProps {
  value: ProdutoQuantidade[];
  onChange: (produtos: ProdutoQuantidade[]) => void;
  categoriasHabilitadas: number[];
}

export default function ProdutoSelector({ 
  value, 
  onChange, 
  categoriasHabilitadas 
}: ProdutoSelectorProps) {
  const { produtos } = useProdutoStore();

  // Filtrar produtos apenas das categorias habilitadas
  const produtosFiltrados = produtos.filter(produto => {
    if (!categoriasHabilitadas || categoriasHabilitadas.length === 0) {
      return true; // Se não há categorias habilitadas, mostrar todos
    }
    return categoriasHabilitadas.includes(produto.categoriaId);
  });

  const adicionarProduto = () => {
    onChange([...value, { produto: '', quantidade: 0 }]);
  };

  const removerProduto = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const atualizarProduto = (index: number, campo: 'produto' | 'quantidade', valor: string | number) => {
    const novosProdutos = [...value];
    if (campo === 'produto') {
      novosProdutos[index].produto = valor as string;
    } else {
      novosProdutos[index].quantidade = Number(valor);
    }
    onChange(novosProdutos);
  };

  if (produtosFiltrados.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Nenhum produto disponível para as categorias habilitadas deste cliente.
        Configure as categorias do cliente primeiro.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Produtos e Quantidades</Label>
        <Button type="button" onClick={adicionarProduto} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>
      
      {value.map((item, index) => (
        <div key={index} className="grid grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor={`produto-${index}`}>Produto</Label>
            <Select
              value={item.produto}
              onValueChange={(valor) => atualizarProduto(index, 'produto', valor)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {produtosFiltrados.map(produto => (
                  <SelectItem key={produto.id} value={produto.nome}>
                    {produto.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`quantidade-${index}`}>Quantidade</Label>
            <Input
              id={`quantidade-${index}`}
              type="number"
              min="0"
              value={item.quantidade}
              onChange={(e) => atualizarProduto(index, 'quantidade', e.target.value)}
            />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => removerProduto(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      {value.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
        </div>
      )}
    </div>
  );
}
