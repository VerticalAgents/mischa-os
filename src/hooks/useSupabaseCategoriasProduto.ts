
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CategoriasProdutoSupabase {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubcategoriaProdutoSupabase {
  id: number;
  nome: string;
  descricao?: string;
  categoria_id: number;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCategoriasProduto = () => {
  const [categorias, setCategorias] = useState<CategoriasProdutoSupabase[]>([]);
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProdutoSupabase[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias_produto')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias de produto:', error);
        toast({
          title: "Erro ao carregar categorias",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setCategorias((data as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar categorias de produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarSubcategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_produto')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar subcategorias:', error);
        return;
      }

      setSubcategorias((data as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
    }
  };

  const adicionarCategoria = async (nome: string, descricao?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('categorias_produto')
        .insert([{ nome, descricao, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar categoria:', error);
        toast({
          title: "Erro ao criar categoria",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      setCategorias(prev => [...prev, data as CategoriasProdutoSupabase]);
      toast({
        title: "Categoria criada",
        description: `A categoria "${nome}" foi criada com sucesso.`
      });
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return null;
    }
  };

  const atualizarCategoria = async (id: number, nome: string, descricao?: string) => {
    try {
      const { data, error } = await supabase
        .from('categorias_produto')
        .update({ nome, descricao })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        toast({
          title: "Erro ao atualizar categoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setCategorias(prev => prev.map(cat => cat.id === id ? data as CategoriasProdutoSupabase : cat));
      toast({
        title: "Categoria atualizada",
        description: `A categoria "${nome}" foi atualizada com sucesso.`
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return false;
    }
  };

  const removerCategoria = async (id: number) => {
    try {
      const { error } = await supabase
        .from('categorias_produto')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover categoria:', error);
        toast({
          title: "Erro ao remover categoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setCategorias(prev => prev.filter(cat => cat.id !== id));
      toast({
        title: "Categoria removida",
        description: "A categoria foi removida com sucesso."
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      return false;
    }
  };

  const adicionarSubcategoria = async (categoriaId: number, nome: string, descricao?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('subcategorias_produto')
        .insert([{ nome, descricao, categoria_id: categoriaId, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar subcategoria:', error);
        toast({
          title: "Erro ao criar subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      setSubcategorias(prev => [...prev, data as SubcategoriaProdutoSupabase]);
      toast({
        title: "Subcategoria criada",
        description: `A subcategoria "${nome}" foi criada com sucesso.`
      });
      return data;
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error);
      return null;
    }
  };

  const atualizarSubcategoria = async (id: number, nome: string, descricao?: string) => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_produto')
        .update({ nome, descricao })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar subcategoria:', error);
        toast({
          title: "Erro ao atualizar subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setSubcategorias(prev => prev.map(sub => sub.id === id ? data as SubcategoriaProdutoSupabase : sub));
      toast({
        title: "Subcategoria atualizada",
        description: `A subcategoria "${nome}" foi atualizada com sucesso.`
      });
      return true;
    } catch (error) {
      console.error('Erro ao atualizar subcategoria:', error);
      return false;
    }
  };

  const removerSubcategoria = async (id: number) => {
    try {
      const { error } = await supabase
        .from('subcategorias_produto')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao remover subcategoria:', error);
        toast({
          title: "Erro ao remover subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setSubcategorias(prev => prev.filter(sub => sub.id !== id));
      toast({
        title: "Subcategoria removida",
        description: "A subcategoria foi removida com sucesso."
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover subcategoria:', error);
      return false;
    }
  };

  const getSubcategoriasPorCategoria = (categoriaId: number) => {
    return subcategorias.filter(sub => sub.categoria_id === categoriaId);
  };

  useEffect(() => {
    carregarCategorias();
    carregarSubcategorias();
  }, []);

  return {
    categorias,
    subcategorias,
    loading,
    carregarCategorias,
    carregarSubcategorias,
    adicionarCategoria,
    atualizarCategoria,
    removerCategoria,
    adicionarSubcategoria,
    atualizarSubcategoria,
    removerSubcategoria,
    getSubcategoriasPorCategoria
  };
};
