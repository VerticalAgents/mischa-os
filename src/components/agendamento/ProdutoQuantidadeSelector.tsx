import { useEffect, useMemo, useState } from 'react';
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
import {
  converterParaNivel,
  converterParaUnidades,
  inferirNivel,
  niveisComUnidade,
  NIVEL_UNIDADE,
  type NivelEmbalagem,
} from '@/utils/niveisEmbalagem';

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
  /**
   * Categorias habilitadas do cliente. Quando informado, tem prioridade sobre
   * a busca via useClienteStore — necessário para fluxos onde o store não é
   * populado (ex.: visualização do representante em /rep/clientes).
   */
  categoriasHabilitadas?: number[];
}

export default function ProdutoQuantidadeSelector({ 
  value, 
  onChange, 
  clienteId,
  quantidadeTotal,
  onQuantidadeTotalChange,
  categoriasHabilitadas
}: ProdutoQuantidadeSelectorProps) {
  const { produtos, carregarProdutos, loading: loadingProdutos } = useSupabaseProdutos();
  const { getClientePorId } = useClienteStore();
  const { proporcoes, obterProporcoesParaPedido } = useSupabaseProporoesPadrao();
  const [refreshing, setRefreshing] = useState(false);
  const [niveisPorProdutoId, setNiveisPorProdutoId] = useState<Record<string, NivelEmbalagem[]>>({});
  const [nivelSelecionadoPorIndex, setNivelSelecionadoPorIndex] = useState<Record<number, string>>({});
  const { toast } = useToast();

  const cliente = getClientePorId(clienteId);

  // Filtrar produtos:
  //  1) somente ativos (produtos inativados no estoque não devem aparecer)
  //  2) pertencentes a uma categoria habilitada para o cliente.
  //     Se o cliente não tem nenhuma categoria habilitada, NENHUM produto é exibido.
  // Prioriza categoriasHabilitadas vindas por prop; cai no store apenas como fallback.
  const habilitadas =
    categoriasHabilitadas && categoriasHabilitadas.length > 0
      ? categoriasHabilitadas
      : cliente?.categoriasHabilitadas ?? [];

  const produtosFiltrados = produtos.filter(produto => {
    if (!produto.ativo) return false;
    if (habilitadas.length === 0) return false;
    return habilitadas.includes(produto.categoria_id || 0);
  });

  // Filtrar produtos que ainda não foram adicionados
  const produtosDisponiveis = produtosFiltrados.filter(produto => {
    return !value.some(item => item.produto === produto.nome);
  });

  const produtoPorNome = useMemo(() => {
    return new Map(produtos.map((produto) => [produto.nome, produto]));
  }, [produtos]);

  useEffect(() => {
    let cancelado = false;
    const produtoIds = produtosFiltrados.map((produto) => produto.id);

    if (produtoIds.length === 0) {
      setNiveisPorProdutoId({});
      return;
    }

    const carregarNiveis = async () => {
      const { data, error } = await supabase
        .from('niveis_embalagem_produto')
        .select('id, produto_id, nome, abreviacao, unidades_por_nivel, ordem')
        .in('produto_id', produtoIds)
        .order('ordem', { ascending: true })
        .order('unidades_por_nivel', { ascending: true });

      if (cancelado) return;

      if (error) {
        console.error('Erro ao carregar níveis de embalagem:', error);
        setNiveisPorProdutoId({});
        return;
      }

      const agrupados = ((data || []) as NivelEmbalagem[]).reduce<Record<string, NivelEmbalagem[]>>((acc, nivel) => {
        if (!acc[nivel.produto_id]) acc[nivel.produto_id] = [];
        acc[nivel.produto_id].push(nivel);
        return acc;
      }, {});

      setNiveisPorProdutoId(agrupados);
    };

    carregarNiveis();

    return () => {
      cancelado = true;
    };
  }, [produtosFiltrados]);

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
    setNivelSelecionadoPorIndex((atuais) => {
      const proximos: Record<number, string> = {};
      Object.entries(atuais).forEach(([key, nivelId]) => {
        const itemIndex = Number(key);
        if (itemIndex < index) proximos[itemIndex] = nivelId;
        if (itemIndex > index) proximos[itemIndex - 1] = nivelId;
      });
      return proximos;
    });
  };

  const atualizarProduto = (index: number, campo: 'produto' | 'quantidade', valor: string | number) => {
    const novosProdutos = [...value];
    if (campo === 'produto') {
      novosProdutos[index].produto = valor as string;
      setNivelSelecionadoPorIndex((atuais) => ({ ...atuais, [index]: NIVEL_UNIDADE.id }));
    } else {
      novosProdutos[index].quantidade = Number(valor);
    }
    onChange(novosProdutos);
    
    // Atualizar quantidade total automaticamente quando quantidades individuais mudarem
    if (campo === 'quantidade' && onQuantidadeTotalChange) {
      const novaQuantidadeTotal = novosProdutos.reduce((soma, p) => soma + p.quantidade, 0);
      onQuantidadeTotalChange(novaQuantidadeTotal);
    }
  };

  const atualizarQuantidadePorNivel = (index: number, valor: string, nivel: NivelEmbalagem) => {
    const quantidadeNivel = Number(valor);
    atualizarProduto(index, 'quantidade', converterParaUnidades(quantidadeNivel, nivel));
  };

  const somaQuantidades = value.reduce((soma, produto) => soma + produto.quantidade, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label className="text-base font-medium">Produtos e Quantidades</Label>
        <TooltipProvider>
          <div className="flex items-center gap-2 flex-wrap sm:justify-end">
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

      {loadingProdutos || produtos.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Carregando produtos…
        </div>
      ) : habilitadas.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Configure as categorias do cliente primeiro.
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          Nenhum produto ativo nas categorias habilitadas deste cliente.
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
        const produtoSelecionado = produtoPorNome.get(item.produto);
        const niveisExtras = produtoSelecionado ? (niveisPorProdutoId[produtoSelecionado.id] || []) : [];
        const niveisProduto = produtoSelecionado ? niveisComUnidade(niveisExtras) : [NIVEL_UNIDADE];
        const nivelInferido = inferirNivel(item.quantidade, niveisExtras);
        const nivelSelecionadoId = nivelSelecionadoPorIndex[index] || nivelInferido.id;
        const nivelSelecionado = niveisProduto.find((nivel) => nivel.id === nivelSelecionadoId) || NIVEL_UNIDADE;
        const quantidadeNoNivel = converterParaNivel(item.quantidade, nivelSelecionado);

        return (
          <div key={index} className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
            <div className="space-y-2 flex-1 min-w-0">
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
            <div className="space-y-2 w-full sm:w-36">
              <Label htmlFor={`nivel-${index}`}>Nível</Label>
              <Select
                value={nivelSelecionado.id}
                onValueChange={(nivelId) => setNivelSelecionadoPorIndex((atuais) => ({ ...atuais, [index]: nivelId }))}
                disabled={!produtoSelecionado}
              >
                <SelectTrigger id={`nivel-${index}`}>
                  <SelectValue placeholder="Nível" />
                </SelectTrigger>
                <SelectContent>
                  {niveisProduto.map((nivel) => (
                    <SelectItem key={nivel.id} value={nivel.id}>
                      {nivel.abreviacao} · {nivel.unidades_por_nivel} un
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full sm:w-28">
              <Label htmlFor={`quantidade-${index}`}>Quantidade</Label>
              <Input
                id={`quantidade-${index}`}
                type="number"
                min="0"
                step={nivelSelecionado.unidades_por_nivel === 1 ? 1 : 0.01}
                value={quantidadeNoNivel}
                onChange={(e) => atualizarQuantidadePorNivel(index, e.target.value, nivelSelecionado)}
              />
            </div>
            <div className="flex justify-end sm:block">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => removerProduto(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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
