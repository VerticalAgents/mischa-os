
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { dataCache } from '@/utils/dataCache';

interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

const CACHE_KEY = 'categorias_estabelecimento';
const REQUEST_TIMEOUT = 8000; // 8 segundos
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY = 1000; // 1 segundo

// Helper para timeout de requisições
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Helper para retry com backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  attempts: number = RETRY_ATTEMPTS,
  delay: number = RETRY_DELAY
): Promise<T> => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
  throw new Error('All retry attempts failed');
};

export const useSupabaseCategoriasEstabelecimento = () => {
  const [categorias, setCategorias] = useState<CategoriaEstabelecimento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarCategorias = useCallback(async (forceRefresh: boolean = false) => {
    // Verificar cache primeiro (se não for refresh forçado)
    if (!forceRefresh && dataCache.has(CACHE_KEY)) {
      const cachedData = dataCache.get<CategoriaEstabelecimento[]>(CACHE_KEY);
      if (cachedData) {
        setCategorias(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const fetchData = async () => {
        const { data, error } = await supabase
          .from('categorias_estabelecimento')
          .select('*')
          .eq('ativo', true)
          .order('nome');

        if (error) throw error;
        return data || [];
      };

      const data = await retryWithBackoff(
        () => withTimeout(fetchData(), REQUEST_TIMEOUT)
      );

      console.log(`✅ Categorias estabelecimento carregadas: ${data.length} itens`);
      
      setCategorias(data);
      dataCache.set(CACHE_KEY, data, 10); // Cache por 10 minutos
      
    } catch (error: any) {
      console.error('❌ Erro ao carregar categorias estabelecimento:', error);
      
      const errorMessage = error.message || 'Erro ao carregar categorias';
      setError(errorMessage);
      
      // Tentar usar dados do cache mesmo que expirado como fallback
      const cachedData = dataCache.get<CategoriaEstabelecimento[]>(CACHE_KEY);
      if (cachedData) {
        console.log('📦 Usando dados do cache como fallback');
        setCategorias(cachedData);
      } else {
        setCategorias([]); // Array vazio para não travar outras funcionalidades
      }

      // Não mostrar toast para erros de timeout ou autenticação
      if (!error.message?.includes('timeout') && 
          !error.message?.includes('JWT expired') &&
          !error.message?.includes('Authentication failed')) {
        toast({
          title: "Aviso",
          description: "Erro ao carregar categorias. Usando dados em cache.",
          variant: "default"
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const adicionarCategoria = useCallback(async (categoria: {
    nome: string;
    descricao?: string;
  }) => {
    try {
      console.log('➕ Adicionando categoria:', categoria);
      
      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .insert({
          nome: categoria.nome.trim(),
          descricao: categoria.descricao?.trim() || null,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      console.log('✅ Categoria criada:', data);
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso"
      });

      // Limpar cache e recarregar
      dataCache.clear(CACHE_KEY);
      await carregarCategorias(true);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao adicionar categoria:', error);
      toast({
        title: "Erro ao criar categoria",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  }, [carregarCategorias]);

  const atualizarCategoria = useCallback(async (id: number, updates: {
    nome?: string;
    descricao?: string;
  }) => {
    try {
      console.log('✏️ Atualizando categoria:', id, updates);
      
      const updateData: any = {};
      if (updates.nome) updateData.nome = updates.nome.trim();
      if (updates.descricao !== undefined) updateData.descricao = updates.descricao?.trim() || null;
      
      const { error } = await supabase
        .from('categorias_estabelecimento')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso"
      });

      // Limpar cache e recarregar
      dataCache.clear(CACHE_KEY);
      await carregarCategorias(true);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao atualizar categoria:', error);
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  }, [carregarCategorias]);

  const removerCategoria = useCallback(async (id: number) => {
    try {
      console.log('🗑️ Removendo categoria:', id);
      
      const { error } = await supabase
        .from('categorias_estabelecimento')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso"
      });

      // Limpar cache e recarregar
      dataCache.clear(CACHE_KEY);
      await carregarCategorias(true);
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao remover categoria:', error);
      toast({
        title: "Erro ao remover categoria",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  }, [carregarCategorias]);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  return {
    categorias,
    loading,
    error,
    carregarCategorias,
    adicionarCategoria,
    atualizarCategoria,
    removerCategoria,
  };
};
