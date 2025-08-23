
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useClienteStore } from '@/hooks/useClienteStore';

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
  const { produtos, carregarProdutos } = useSupabaseProdutos();
  const { getClientePorId } = useClienteStore();
  const [refreshing, setRefreshing] = useState(false);

  const cliente = getClientePorId(clienteId);

  // Filtrar produtos apenas das categorias habilitadas do cliente
  const produtosFiltrados = produtos.filter(produto => {
    if (!cliente?.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
      return true;
    }
    return cliente.categoriasHabilitadas.includes(produto.categoria_id || 0);
  });

  // Filtrar produtos que ainda não foram adicionados
  const produtosDisponiveis = produtosFiltrados.filter(produto => {
    return !value.some(item => item.produto === produto.nome);
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await carregarProdutos();
    } finally {
      setRefreshing(false);
    }
  };

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

  const somaQuantidades = value.reduce((soma, produto) => soma + produto.quantidade, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Produtos e Quantidades</Label>
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </Button>
          <Button 
            type="button" 
            onClick={adicionarProduto} 
            size="sm"
            disabled={produtosDisponiveis.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {produtosFiltrados.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum produto disponível para as categorias habilitadas deste cliente.
          Configure as categorias do cliente primeiro.
        </div>
      ) : produtosDisponiveis.length === 0 && value.length > 0 ? (
        <div className="text-center py-2 text-amber-600 bg-amber-50 rounded-md border border-amber-200">
          Todos os produtos disponíveis já foram adicionados.
        </div>
      ) : null}
      
      {value.map((item, index) => {
        // Para cada item, mostrar apenas produtos disponíveis + o produto já selecionado
        const opcoesParaEsteItem = produtosFiltrados.filter(produto => {
          // Incluir se é o produto já selecionado neste item
          if (item.produto === produto.nome) return true;
          // Incluir se não está sendo usado em nenhum outro item
          return !value.some((outroItem, outroIndex) => 
            outroIndex !== index && outroItem.produto === produto.nome
          );
        });

        return (
          <div key={index} className="grid grid-cols-3 gap-4 items-end p-4 border rounded-lg">
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
                  {opcoesParaEsteItem.map(produto => (
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
        );
      })}
      
      {value.length === 0 && produtosDisponiveis.length > 0 && (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum produto adicionado. Clique em "Adicionar Produto" para começar.
        </div>
      )}

      {value.length > 0 && (
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
          <span>Soma das quantidades:</span>
          <span className={`font-medium ${somaQuantidades !== quantidadeTotal ? 'text-red-600' : 'text-green-600'}`}>
            {somaQuantidades} / {quantidadeTotal}
          </span>
        </div>
      )}
    </div>
  );
}
