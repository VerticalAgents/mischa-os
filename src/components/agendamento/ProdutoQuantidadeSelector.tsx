
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

interface ProdutoQuantidadeSelectorProps {
  value: ProdutoQuantidade[];
  onChange: (produtos: ProdutoQuantidade[]) => void;
  clienteId: string;
  quantidadeTotal: number;
}

export default function ProdutoQuantidadeSelector({ 
  value, 
  onChange, 
  clienteId,
  quantidadeTotal 
}: ProdutoQuantidadeSelectorProps) {
  const { produtos } = useProdutoStore();

  // Aplicar ordenação alfabética diretamente aqui (fonte única de ordenação)
  const produtosOrdenados = produtos
    .filter(produto => produto.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { 
      sensitivity: 'base', // Ignora acentos e capitalização
      numeric: true 
    }));

  const adicionarProduto = () => {
    const novosProdutos = [...value, { produto: '', quantidade: 0 }];
    onChange(novosProdutos);
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
    
    // Reordenar automaticamente após cada alteração para manter consistência
    const produtosReordenados = novosProdutos.sort((a, b) => {
      if (!a.produto || !b.produto) return 0;
      return a.produto.localeCompare(b.produto, 'pt-BR', { 
        sensitivity: 'base',
        numeric: true 
      });
    });
    
    onChange(produtosReordenados);
  };

  const somaQuantidades = value.reduce((soma, item) => soma + item.quantidade, 0);
  const diferenca = quantidadeTotal - somaQuantidades;

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
                {produtosOrdenados.map(produto => (
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

      {value.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center text-sm">
            <span>Total de produtos:</span>
            <span className="font-medium">{somaQuantidades} unidades</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span>Quantidade total esperada:</span>
            <span className="font-medium">{quantidadeTotal} unidades</span>
          </div>
          {diferenca !== 0 && (
            <div className={`flex justify-between items-center text-sm mt-1 ${diferenca > 0 ? 'text-orange-600' : 'text-red-600'}`}>
              <span>Diferença:</span>
              <span className="font-medium">
                {diferenca > 0 ? `+${diferenca}` : diferenca} unidades
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
