
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ReceitaCompleta {
  id: string;
  nome: string;
  descricao?: string;
  rendimento: number;
  unidade_rendimento: string;
  peso_total: number;
  custo_total: number;
  custo_unitario: number;
  user_id: string;
  ativo?: boolean;
  produtos_ativos_vinculados: number;
  itens: {
    id: string;
    insumo_id: string;
    nome_insumo: string;
    quantidade: number;
    custo_item: number;
    unidade_medida: string;
  }[];
}

export interface ReceitaInput {
  nome: string;
  descricao?: string;
  rendimento: number;
  unidade_rendimento: string;
}

interface CacheState {
  data: ReceitaCompleta[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useOptimizedReceitasData = () => {
  const [receitas, setReceitas] = useState<ReceitaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cache, setCache] = useState<CacheState | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se cache é válido
  const isCacheValid = useMemo(() => {
    if (!cache) return false;
    const now = Date.now();
    return (now - cache.timestamp) < CACHE_DURATION;
  }, [cache]);

  // Filtrar receitas por termo de busca
  const receitasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return receitas;
    
    return receitas.filter(receita =>
      receita.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [receitas, searchTerm]);

  // Métricas calculadas
  const metricas = useMemo(() => {
    const totalReceitas = receitas.length;
    const receitasAtivas = receitas.filter(r => r.itens.length > 0).length;
    const receitasVazias = receitas.filter(r => r.itens.length === 0).length;
    const receitasCustoAlto = receitas.filter(r => r.custo_total > 50).length;

    return {
      totalReceitas,
      receitasAtivas,
      receitasVazias,
      receitasCustoAlto
    };
  }, [receitas]);

  const carregarReceitas = async (forceRefresh = false) => {
    try {
      // Se cache válido e não é refresh forçado, usar cache
      if (isCacheValid && !forceRefresh && cache) {
        console.log('📦 Usando dados do cache para receitas');
        setReceitas(cache.data);
        setLoading(false);
        return;
      }

      setLoading(!cache); // Só mostrar loading se não tem cache
      setRefreshing(forceRefresh);
      
      console.log('🔄 Carregando dados otimizados das receitas...');
      
      // Carregar todas as receitas básicas
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas_base')
        .select('*')
        .order('nome');

      if (receitasError) {
        console.error('❌ Erro ao carregar receitas:', receitasError);
        throw receitasError;
      }

      if (!receitasData || receitasData.length === 0) {
        console.log('ℹ️ Nenhuma receita encontrada');
        const emptyResult: ReceitaCompleta[] = [];
        setReceitas(emptyResult);
        setCache({ data: emptyResult, timestamp: Date.now() });
        return;
      }

      // Carregar TODOS os itens de receita de uma vez com dados dos insumos
      const { data: itensData, error: itensError } = await supabase
        .from('itens_receita')
        .select(`
          id,
          receita_id,
          insumo_id,
          quantidade,
          insumos (
            nome,
            custo_medio,
            volume_bruto,
            unidade_medida
          )
        `);

      if (itensError) {
        console.error('❌ Erro ao carregar itens das receitas:', itensError);
        throw itensError;
      }

      console.log(`📦 Carregados ${receitasData.length} receitas e ${itensData?.length || 0} itens`);

      // Carregar componentes de produto (vínculo receita -> produto) para contar produtos ativos
      const { data: componentesData } = await supabase
        .from('componentes_produto')
        .select('item_id, produto_id, tipo, produtos_finais(ativo)')
        .eq('tipo', 'receita');

      const produtosAtivosPorReceita = new Map<string, number>();
      if (componentesData) {
        componentesData.forEach((c: any) => {
          const ativo = c.produtos_finais?.ativo === true;
          if (ativo) {
            produtosAtivosPorReceita.set(
              c.item_id,
              (produtosAtivosPorReceita.get(c.item_id) || 0) + 1
            );
          }
        });
      }

      // Criar mapa de itens por receita para acesso O(1)
      const itensPorReceita = new Map<string, any[]>();
      
      if (itensData) {
        itensData.forEach(item => {
          const receitaId = item.receita_id;
          if (!itensPorReceita.has(receitaId)) {
            itensPorReceita.set(receitaId, []);
          }
          itensPorReceita.get(receitaId)!.push(item);
        });
      }

      // Processar receitas com todos os cálculos de uma vez
      const receitasCompletas: ReceitaCompleta[] = receitasData.map(receita => {
        const itensReceita = itensPorReceita.get(receita.id) || [];
        
        const itensProcessados = itensReceita.map(item => {
          const insumo = item.insumos as any;
          const custoUnitario = insumo && insumo.volume_bruto > 0 
            ? (insumo.custo_medio || 0) / insumo.volume_bruto 
            : 0;
          const custoItem = custoUnitario * Number(item.quantidade);

          return {
            id: item.id,
            insumo_id: item.insumo_id,
            nome_insumo: insumo?.nome || 'Insumo não encontrado',
            quantidade: Number(item.quantidade),
            custo_item: custoItem,
            unidade_medida: insumo?.unidade_medida || 'g'
          };
        });

        const pesoTotal = itensProcessados.reduce((sum, item) => sum + item.quantidade, 0);
        const custoTotal = itensProcessados.reduce((sum, item) => sum + item.custo_item, 0);
        const custoUnitario = receita.rendimento > 0 ? custoTotal / receita.rendimento : 0;

        return {
          ...receita,
          peso_total: pesoTotal,
          custo_total: custoTotal,
          custo_unitario: custoUnitario,
          produtos_ativos_vinculados: produtosAtivosPorReceita.get(receita.id) || 0,
          itens: itensProcessados
        };
      });

      console.log('✅ Receitas processadas com sucesso');
      
      // Atualizar estado e cache
      setReceitas(receitasCompletas);
      setCache({ 
        data: receitasCompletas, 
        timestamp: Date.now() 
      });
      
    } catch (error) {
      console.error('❌ Erro ao carregar receitas:', error);
      toast({
        title: "Erro ao carregar receitas",
        description: "Ocorreu um erro ao carregar as receitas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const invalidateCache = () => {
    setCache(null);
  };

  const refresh = async () => {
    await carregarReceitas(true);
  };

  const adicionarItemReceita = async (receitaId: string, insumoId: string, quantidade: number) => {
    try {
      const { error } = await supabase
        .from('itens_receita')
        .insert({
          receita_id: receitaId,
          insumo_id: insumoId,
          quantidade: quantidade
        });

      if (error) {
        console.error('Erro ao adicionar item à receita:', error);
        toast({
          title: "Erro ao adicionar item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Item adicionado",
        description: "Item adicionado à receita com sucesso"
      });

      // Invalidar cache e recarregar
      invalidateCache();
      await carregarReceitas(true);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar item à receita:', error);
      toast({
        title: "Erro ao adicionar item",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerItemReceita = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('itens_receita')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Erro ao remover item da receita:', error);
        toast({
          title: "Erro ao remover item",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Item removido",
        description: "Item removido da receita com sucesso"
      });

      // Invalidar cache e recarregar
      invalidateCache();
      await carregarReceitas(true);
      return true;
    } catch (error) {
      console.error('Erro ao remover item da receita:', error);
      toast({
        title: "Erro ao remover item",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const duplicarReceita = async (receitaOriginal: ReceitaCompleta) => {
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

      // Criar nova receita com nome (Cópia) e user_id
      const novaReceita = {
        nome: `${receitaOriginal.nome} (Cópia)`,
        descricao: receitaOriginal.descricao,
        rendimento: receitaOriginal.rendimento,
        unidade_rendimento: receitaOriginal.unidade_rendimento,
        user_id: user.id
      };

      const { data: receitaCriada, error: receitaError } = await supabase
        .from('receitas_base')
        .insert(novaReceita)
        .select()
        .single();

      if (receitaError) {
        console.error('Erro ao duplicar receita:', receitaError);
        toast({
          title: "Erro ao duplicar receita",
          description: receitaError.message,
          variant: "destructive"
        });
        return null;
      }

      // Duplicar todos os itens da receita original
      if (receitaOriginal.itens.length > 0) {
        const itensDuplicados = receitaOriginal.itens.map(item => ({
          receita_id: receitaCriada.id,
          insumo_id: item.insumo_id,
          quantidade: item.quantidade
        }));

        const { error: itensError } = await supabase
          .from('itens_receita')
          .insert(itensDuplicados);

        if (itensError) {
          console.error('Erro ao duplicar itens da receita:', itensError);
          // Não falhar a operação por causa dos itens
        }
      }

      toast({
        title: "Receita duplicada",
        description: `${novaReceita.nome} foi criada com sucesso`
      });

      // Invalidar cache e recarregar
      invalidateCache();
      await carregarReceitas(true);
      return receitaCriada;
    } catch (error) {
      console.error('Erro ao duplicar receita:', error);
      toast({
        title: "Erro ao duplicar receita",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return null;
    }
  };

  const removerReceita = async (receitaId: string) => {
    try {
      // Primeiro remover os itens da receita
      const { error: itensError } = await supabase
        .from('itens_receita')
        .delete()
        .eq('receita_id', receitaId);

      if (itensError) {
        console.error('Erro ao remover itens da receita:', itensError);
      }

      // Depois remover a receita
      const { error } = await supabase
        .from('receitas_base')
        .delete()
        .eq('id', receitaId);

      if (error) {
        console.error('Erro ao remover receita:', error);
        toast({
          title: "Erro ao remover receita",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Receita removida",
        description: "Receita removida com sucesso"
      });

      // Invalidar cache e recarregar
      invalidateCache();
      await carregarReceitas(true);
      return true;
    } catch (error) {
      console.error('Erro ao remover receita:', error);
      toast({
        title: "Erro ao remover receita",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    carregarReceitas();
  }, []);

  return {
    receitas: receitasFiltradas,
    loading,
    refreshing,
    isCacheValid,
    metricas,
    searchTerm,
    setSearchTerm,
    carregarReceitas,
    refresh,
    duplicarReceita,
    removerReceita,
    adicionarItemReceita,
    removerItemReceita,
    invalidateCache
  };
};
