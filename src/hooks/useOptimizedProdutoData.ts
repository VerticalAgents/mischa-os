
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProdutoOptimizado {
  id: string;
  nome: string;
  descricao?: string;
  categoria_id?: number;
  subcategoria_id?: number;
  unidades_producao: number;
  peso_unitario?: number;
  preco_venda?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  estoque_ideal?: number;
  custo_total?: number;
  custo_unitario?: number;
  margem_lucro?: number;
  ordem_categoria?: number;
  user_id: string;
  // Dados calculados otimizados
  custo_unitario_calculado: number;
  margem_real: number;
  componentes_count: number;
}

export interface ComponenteDetalhado {
  id: string;
  tipo: 'receita' | 'insumo';
  item_id: string;
  quantidade: number;
  nome_item: string;
  custo_item: number;
}

export interface ProdutoCompleto extends ProdutoOptimizado {
  componentes?: ComponenteDetalhado[];
}

interface CacheData {
  produtos: ProdutoOptimizado[];
  timestamp: number;
  ttl: number; // 5 minutos
}

interface Metricas {
  totalProdutos: number;
  produtosAtivos: number;
  custoMedio: number;
  margemMedia: number;
}

export const useOptimizedProdutoData = () => {
  const [produtos, setProdutos] = useState<ProdutoOptimizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cache, setCache] = useState<CacheData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const isCacheValid = useMemo(() => {
    if (!cache) return false;
    return Date.now() - cache.timestamp < cache.ttl;
  }, [cache]);

  // Filtrar produtos com base no termo de busca
  const produtosFiltrados = useMemo(() => {
    if (!searchTerm) return produtos;
    
    return produtos.filter(produto =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (produto.descricao && produto.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [produtos, searchTerm]);

  // Calcular métricas
  const metricas = useMemo((): Metricas => {
    return {
      totalProdutos: produtos.length,
      produtosAtivos: produtos.filter(p => p.ativo).length,
      custoMedio: produtos.length > 0 
        ? produtos.reduce((sum, p) => sum + p.custo_unitario_calculado, 0) / produtos.length 
        : 0,
      margemMedia: produtos.length > 0 
        ? produtos.reduce((sum, p) => sum + p.margem_real, 0) / produtos.length 
        : 0
    };
  }, [produtos]);

  const carregarProdutosOtimizado = async (forceReload = false) => {
    // Usar cache se válido e não forçar reload
    if (isCacheValid && !forceReload && cache) {
      console.log('📦 Usando dados do cache');
      setProdutos(cache.produtos);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Carregando produtos otimizado...');
      setLoading(true);

      // Query principal: buscar todos os produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos_finais')
        .select('*')
        .order('nome');

      if (produtosError) {
        console.error('Erro ao carregar produtos:', produtosError);
        toast({
          title: "Erro ao carregar produtos",
          description: produtosError.message,
          variant: "destructive"
        });
        return;
      }

      // Query para todos os componentes de uma vez
      const { data: componentesData, error: componentesError } = await supabase
        .from('componentes_produto')
        .select(`
          id,
          produto_id,
          tipo,
          quantidade,
          item_id
        `);

      if (componentesError) {
        console.error('Erro ao carregar componentes:', componentesError);
      }

      // Query para todos os rendimentos
      const { data: rendimentosData, error: rendimentosError } = await supabase
        .from('rendimentos_receita_produto')
        .select('*');

      if (rendimentosError) {
        console.error('Erro ao carregar rendimentos:', rendimentosError);
      }

      // Query para dados de receitas (uma vez só)
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas_base')
        .select('id, nome, rendimento');

      if (receitasError) {
        console.error('Erro ao carregar receitas:', receitasError);
      }

      // Query para dados de insumos (uma vez só)
      const { data: insumosData, error: insumosError } = await supabase
        .from('insumos')
        .select('id, nome, custo_medio, volume_bruto');

      if (insumosError) {
        console.error('Erro ao carregar insumos:', insumosError);
      }

      // Query para itens de receita (para calcular custos)
      const { data: itensReceitaData, error: itensReceitaError } = await supabase
        .from('itens_receita')
        .select(`
          receita_id,
          quantidade,
          insumo_id
        `);

      if (itensReceitaError) {
        console.error('Erro ao carregar itens de receita:', itensReceitaError);
      }

      // Processar dados otimizado
      const produtosOtimizados = await processarProdutosOtimizado({
        produtos: produtosData || [],
        componentes: componentesData || [],
        rendimentos: rendimentosData || [],
        receitas: receitasData || [],
        insumos: insumosData || [],
        itensReceita: itensReceitaData || []
      });

      // Atualizar cache
      const newCache: CacheData = {
        produtos: produtosOtimizados,
        timestamp: Date.now(),
        ttl: 5 * 60 * 1000 // 5 minutos
      };
      setCache(newCache);
      setProdutos(produtosOtimizados);

      console.log('✅ Produtos carregados e otimizados:', produtosOtimizados.length);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await carregarProdutosOtimizado(true);
    setRefreshing(false);
  };

  const invalidateCache = () => {
    console.log('🗑️ Cache invalidado');
    setCache(null);
  };

  const removerProduto = async (id: string) => {
    try {
      const { error } = await supabase
        .from('produtos_finais')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover produto:', error);
        toast({
          title: "Erro ao remover produto",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Produto removido",
        description: "Produto removido com sucesso",
      });

      await refresh();
      return true;
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      toast({
        title: "Erro ao remover produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const duplicarProduto = async (produto: ProdutoOptimizado) => {
    try {
      // Obter o user_id do usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return null;
      }

      const novoProduto = {
        nome: `${produto.nome} (Cópia)`,
        descricao: produto.descricao,
        categoria_id: produto.categoria_id,
        subcategoria_id: produto.subcategoria_id,
        unidades_producao: produto.unidades_producao,
        peso_unitario: produto.peso_unitario,
        preco_venda: produto.preco_venda,
        ativo: true,
        estoque_atual: produto.estoque_atual || 0,
        estoque_minimo: produto.estoque_minimo,
        estoque_ideal: produto.estoque_ideal,
        custo_total: produto.custo_total,
        custo_unitario: produto.custo_unitario,
        margem_lucro: produto.margem_lucro,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('produtos_finais')
        .insert(novoProduto)
        .select()
        .single();

      if (error) {
        console.error('Erro ao duplicar produto:', error);
        toast({
          title: "Erro ao duplicar produto",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Produto duplicado",
        description: "Produto duplicado com sucesso",
      });

      await refresh();
      return data;
    } catch (error) {
      console.error('Erro ao duplicar produto:', error);
      toast({
        title: "Erro ao duplicar produto",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    carregarProdutosOtimizado();
  }, []);

  return {
    produtos: produtosFiltrados,
    loading,
    refreshing,
    isCacheValid,
    metricas,
    searchTerm,
    setSearchTerm,
    carregarProdutos: carregarProdutosOtimizado,
    refresh,
    removerProduto,
    duplicarProduto,
    invalidateCache
  };
};

// Função para processar todos os dados de uma vez
const processarProdutosOtimizado = async (data: {
  produtos: any[];
  componentes: any[];
  rendimentos: any[];
  receitas: any[];
  insumos: any[];
  itensReceita: any[];
}): Promise<ProdutoOptimizado[]> => {
  const { produtos, componentes, rendimentos, receitas, insumos, itensReceita } = data;

  // Criar maps para acesso rápido
  const receitasMap = new Map(receitas.map(r => [r.id, r]));
  const insumosMap = new Map(insumos.map(i => [i.id, i]));
  const rendimentosMap = new Map(rendimentos.map(r => [`${r.receita_id}-${r.produto_id}`, r]));
  const componentesPorProduto = new Map<string, any[]>();
  
  // Agrupar componentes por produto
  componentes.forEach(comp => {
    const produtoId = comp.produto_id;
    if (!componentesPorProduto.has(produtoId)) {
      componentesPorProduto.set(produtoId, []);
    }
    componentesPorProduto.get(produtoId)!.push(comp);
  });

  // Criar map de custos de receitas
  const custosReceitasMap = new Map<string, number>();
  
  // Calcular custos das receitas uma vez
  receitas.forEach(receita => {
    const itensReceitaFiltrados = itensReceita.filter(item => item.receita_id === receita.id);
    
    if (itensReceitaFiltrados.length > 0) {
      const custoTotalReceita = itensReceitaFiltrados.reduce((total, item) => {
        const insumo = insumosMap.get(item.insumo_id);
        if (insumo) {
          const custoUnitarioInsumo = (insumo.custo_medio || 0) / (insumo.volume_bruto || 1);
          return total + (item.quantidade * custoUnitarioInsumo);
        }
        return total;
      }, 0);
      
      const pesoRealReceita = itensReceitaFiltrados.reduce((total, item) => total + item.quantidade, 0);
      const custoPorGrama = pesoRealReceita > 0 ? custoTotalReceita / pesoRealReceita : 0;
      
      custosReceitasMap.set(receita.id, custoPorGrama);
    }
  });

  // Processar produtos
  return produtos.map(produto => {
    const componentesProduto = componentesPorProduto.get(produto.id) || [];
    
    // Calcular custo total dos componentes
    const custoTotalComponentes = componentesProduto.reduce((total, comp) => {
      let custoItem = 0;
      
      if (comp.tipo === 'receita') {
        const custoPorGrama = custosReceitasMap.get(comp.item_id) || 0;
        custoItem = custoPorGrama * comp.quantidade;
      } else if (comp.tipo === 'insumo') {
        const insumo = insumosMap.get(comp.item_id);
        if (insumo) {
          const custoUnitarioInsumo = insumo.volume_bruto > 0 
            ? (insumo.custo_medio || 0) / insumo.volume_bruto 
            : (insumo.custo_medio || 0);
          custoItem = custoUnitarioInsumo * comp.quantidade;
        }
      }
      
      return total + custoItem;
    }, 0);

    // Buscar rendimento específico para o produto
    const rendimentoEspecifico = rendimentos.find(r => r.produto_id === produto.id);
    const rendimento = rendimentoEspecifico ? rendimentoEspecifico.rendimento : produto.unidades_producao;

    // Calcular custo unitário real
    const custoUnitarioCalculado = rendimento > 0 ? custoTotalComponentes / rendimento : custoTotalComponentes;

    // Calcular margem real
    const margemReal = produto.preco_venda && produto.preco_venda > 0
      ? ((produto.preco_venda - custoUnitarioCalculado) / produto.preco_venda) * 100
      : 0;

    return {
      ...produto,
      custo_unitario_calculado: custoUnitarioCalculado,
      margem_real: margemReal,
      componentes_count: componentesProduto.length
    } as ProdutoOptimizado;
  });
};
