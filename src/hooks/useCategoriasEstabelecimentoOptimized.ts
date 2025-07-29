
import { useState, useEffect } from 'react';
import { dataCache } from '@/utils/dataCache';
import { supabase } from '@/integrations/supabase/client';

interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

const CACHE_KEY = 'categorias_estabelecimento_form';
const CACHE_TTL = 15; // 15 minutos para formulários

export const useCategoriasEstabelecimentoOptimized = (loadOnMount: boolean = false) => {
  const [categorias, setCategorias] = useState<CategoriaEstabelecimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarCategorias = async () => {
    // Verificar cache primeiro
    if (dataCache.has(CACHE_KEY)) {
      const cachedData = dataCache.get<CategoriaEstabelecimento[]>(CACHE_KEY);
      if (cachedData) {
        setCategorias(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .select('id, nome, descricao, ativo')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.warn('⚠️ Erro ao carregar categorias para formulário:', error);
        // Em caso de erro, retornar array vazio para não travar o formulário
        setCategorias([]);
        setError('Erro ao carregar categorias');
        return [];
      }

      const categoriasList = data || [];
      console.log(`📋 Categorias para formulário carregadas: ${categoriasList.length} itens`);
      
      setCategorias(categoriasList);
      dataCache.set(CACHE_KEY, categoriasList, CACHE_TTL);
      
      return categoriasList;
    } catch (error: any) {
      console.error('❌ Erro ao carregar categorias:', error);
      setCategorias([]);
      setError(error.message || 'Erro desconhecido');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar sob demanda
  const carregarSeNecessario = async () => {
    if (categorias.length === 0 && !loading) {
      return await carregarCategorias();
    }
    return categorias;
  };

  // Carregar apenas se solicitado na montagem
  useEffect(() => {
    if (loadOnMount) {
      carregarCategorias();
    }
  }, [loadOnMount]);

  return {
    categorias,
    loading,
    error,
    carregarCategorias,
    carregarSeNecessario
  };
};
