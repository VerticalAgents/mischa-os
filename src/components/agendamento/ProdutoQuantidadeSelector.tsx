
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { useSaborStore } from "@/hooks/useSaborStore";

interface ItemPedidoCustomizado {
  produto: string;
  quantidade: number;
}

interface ProdutoQuantidadeSelectorProps {
  value: ItemPedidoCustomizado[];
  onChange: (items: ItemPedidoCustomizado[]) => void;
  clienteId: string;
  quantidadeTotal: number;
}

export default function ProdutoQuantidadeSelector({
  value,
  onChange,
  clienteId,
  quantidadeTotal
}: ProdutoQuantidadeSelectorProps) {
  const { sabores } = useSaborStore();
  const [items, setItems] = useState<ItemPedidoCustomizado[]>(value || []);

  // Sincronizar com o valor externo quando necessário
  useEffect(() => {
    if (JSON.stringify(value) !== JSON.stringify(items)) {
      setItems(value || []);
    }
  }, [value]);

  // Atualizar o componente pai sempre que items mudar
  useEffect(() => {
    onChange(items);
  }, [items, onChange]);

  const adicionarItem = () => {
    const novoItem: ItemPedidoCustomizado = {
      produto: "",
      quantidade: 0
    };
    
    console.log('🔧 Adicionando novo produto:', novoItem);
    console.log('🔧 Items antes da adição:', items);
    
    const novosItems = [...items, novoItem];
    setItems(novosItems);
    
    console.log('🔧 Items após adição:', novosItems);
  };

  const removerItem = (index: number) => {
    console.log('🗑️ Removendo produto no índice:', index);
    
    const novosItems = items.filter((_, i) => i !== index);
    setItems(novosItems);
    
    console.log('🗑️ Items após remoção:', novosItems);
  };

  const atualizarItem = (index: number, campo: keyof ItemPedidoCustomizado, valor: string | number) => {
    console.log('✏️ Atualizando item:', { index, campo, valor });
    
    const novosItems = items.map((item, i) => {
      if (i === index) {
        return {
          ...item,
          [campo]: campo === 'quantidade' ? Number(valor) : valor
        };
      }
      return item;
    });
    
    setItems(novosItems);
    
    console.log('✏️ Items após atualização:', novosItems);
  };

  const totalDistribuido = items.reduce((soma, item) => soma + (item.quantidade || 0), 0);
  const saboresAtivos = sabores.filter(sabor => sabor.ativo);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Produtos e Quantidades</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={adicionarItem}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`item-${index}-${Date.now()}`} className="flex items-end gap-3 p-3 border rounded-lg bg-gray-50">
            <div className="flex-1">
              <Label htmlFor={`produto-${index}`} className="text-sm">Produto</Label>
              <Select 
                value={item.produto} 
                onValueChange={(valor) => atualizarItem(index, 'produto', valor)}
              >
                <SelectTrigger id={`produto-${index}`}>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {saboresAtivos.map((sabor) => (
                    <SelectItem key={sabor.id} value={sabor.nome}>
                      {sabor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-24">
              <Label htmlFor={`quantidade-${index}`} className="text-sm">Qtd</Label>
              <Input
                id={`quantidade-${index}`}
                type="number"
                min="0"
                value={item.quantidade || ''}
                onChange={(e) => atualizarItem(index, 'quantidade', e.target.value)}
                placeholder="0"
              />
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removerItem(index)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p>Nenhum produto adicionado</p>
            <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-3 border-t bg-gray-50 px-3 py-2 rounded-lg">
        <span className="text-sm font-medium">Total distribuído:</span>
        <span className={`font-bold ${totalDistribuido === quantidadeTotal ? 'text-green-600' : 'text-orange-600'}`}>
          {totalDistribuido} / {quantidadeTotal}
        </span>
      </div>
    </div>
  );
}
