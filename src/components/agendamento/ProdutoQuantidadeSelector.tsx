import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Trash2, RefreshCw, PackagePlus, History, Calculator } from 'lucide-react';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseProporoesPadrao } from '@/hooks/useSupabaseProporoesPadrao';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProdutoQuantidade {
  produto: string;
  quantidade: number;
}

interface ProdutoQuantidadeSelectorProps {
  value: ProdutoQuantidade[];
  onChange: (produtos: ProdutoQuantidade[]) => void;
  clienteId: string;
  quantidadeTotal: number;
  onQuantidadeTotalChange?: (novaQuantidade: number) => void;
}

export default function ProdutoQuantidadeSelector({ 
  value, 
  onChange, 
  clienteId,
  quantidadeTotal,
  onQuantidadeTotalChange
}: ProdutoQuantidadeSelectorProps) {
  const { produtos, carregarProdutos } = useSupabaseProdutos();
  const { getClientePorId } = useClienteStore();
  const { proporcoes, obterProporcoesParaPedido } = useSupabaseProporoesPadrao();
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

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

  const repetirUltimoPedido = async () => {
    try {
      const { data: ultimoPedido, error } = await supabase
        .from('historico_entregas')
        .select('itens, quantidade')
        .eq('cliente_id', clienteId)
        .eq('tipo', 'entrega')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !ultimoPedido?.itens) {
        toast({ title: "Nenhum pedido anterior encontrado", variant: "destructive" });
        return;
      }

      const itens = ultimoPedido.itens as { produto_id: string; quantidade: number }[];
      const produtoIds = itens.map(item => item.produto_id);
      
      const { data: produtos } = await supabase
        .from('produtos_finais')
        .select('id, nome')
        .in('id', produtoIds);

      const novosProdutos = itens
        .map(item => {
          const produto = produtos?.find(p => p.id === item.produto_id);
          return produto ? { produto: produto.nome, quantidade: item.quantidade } : null;
        })
        .filter(Boolean) as ProdutoQuantidade[];

      onChange(novosProdutos);
      
      // Atualizar quantidade total com a soma dos produtos
      const somaQuantidades = novosProdutos.reduce((soma, p) => soma + p.quantidade, 0);
      if (onQuantidadeTotalChange) {
        onQuantidadeTotalChange(somaQuantidades);
      }
      
      toast({ title: "Último pedido carregado", description: `${novosProdutos.length} itens, total: ${somaQuantidades}` });
    } catch (error) {
      console.error('Erro ao repetir último pedido:', error);
      toast({ title: "Erro ao carregar pedido anterior", variant: "destructive" });
    }
  };

  const preencherQuantidades = async () => {
    if (value.length === 0) return;
    
    try {
      const proporcoesCalculadas = await obterProporcoesParaPedido(quantidadeTotal);
      
      if (proporcoesCalculadas.length === 0) {
        toast({ 
          title: "Proporções não configuradas", 
          description: "Configure as proporções padrão primeiro",
          variant: "destructive" 
        });
        return;
      }

      const produtosAtualizados = value.map(item => {
        const proporcao = proporcoesCalculadas.find(p => p.produto_nome === item.produto);
        return {
          produto: item.produto,
          quantidade: proporcao?.quantidade || 0
        };
      });

      onChange(produtosAtualizados);
      toast({ title: "Quantidades preenchidas", description: "Baseado nas proporções padrão" });
    } catch (error) {
      console.error('Erro ao preencher quantidades:', error);
      toast({ title: "Erro ao preencher quantidades", variant: "destructive" });
    }
  };

  const adicionarProduto = () => {
    onChange([...value, { produto: '', quantidade: 0 }]);
  };

  const adicionarProdutosPadrao = () => {
    // 1. Filtrar produtos com proporção padrão > 0
    const produtosComProporcao = produtosFiltrados.filter(produto => {
      const proporcao = proporcoes.find(p => p.produto_id === produto.id);
      return proporcao && proporcao.percentual > 0;
    });
    
    // 2. Filtrar produtos não adicionados ainda
    const produtosDisponiveis = produtosComProporcao.filter(produto => {
      return !value.some(item => item.produto === produto.nome);
    });
    
    // 3. Ordenar por ordem_categoria (produtos sem ordem vão por último, ordenados por nome)
    const produtosOrdenados = produtosDisponiveis.sort((a, b) => {
      // Produtos com ordem vão primeiro
      if (a.ordem_categoria != null && b.ordem_categoria != null) {
        return a.ordem_categoria - b.ordem_categoria;
      }
      if (a.ordem_categoria != null) return -1;
      if (b.ordem_categoria != null) return 1;
      return a.nome.localeCompare(b.nome);
    });
    
    // 4. Adicionar produtos na lista
    const novosProdutos = produtosOrdenados.map(produto => ({
      produto: produto.nome,
      quantidade: 0
    }));
    onChange([...value, ...novosProdutos]);
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
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar Lista</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={repetirUltimoPedido}
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Repetir Último Pedido</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={adicionarProdutosPadrao}
                  disabled={
                    produtosFiltrados.filter(produto => {
                      const proporcao = proporcoes.find(p => p.produto_id === produto.id);
                      return proporcao && proporcao.percentual > 0 && !value.some(item => item.produto === produto.nome);
                    }).length === 0
                  }
                >
                  <PackagePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Padrão</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={preencherQuantidades}
                  disabled={value.length === 0}
                >
                  <Calculator className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preencher Quantidades</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  size="icon" 
                  onClick={adicionarProduto}
                  disabled={produtosDisponiveis.length === 0}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Adicionar Produto</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
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
