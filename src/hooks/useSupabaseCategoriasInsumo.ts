
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CategoriaInsumoSupabase {
  id: number;
  nome: string;
  tipo: 'padrao' | 'personalizada';
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCategoriasInsumo = () => {
  const [categorias, setCategorias] = useState<CategoriaInsumoSupabase[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias_insumo')
        .select('*')
        .eq('ativo', true)
        .order('tipo')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias de insumo:', error);
        toast({
          title: "Erro ao carregar categorias",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setCategorias((data as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar categorias de insumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarCategoria = async (nome: string) => {
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
        .from('categorias_insumo')
        .insert([{ nome, tipo: 'personalizada', user_id: user.id }])
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

      setCategorias(prev => [...prev, data as CategoriaInsumoSupabase]);
      toast({
        title: "Categoria adicionada",
        description: `Nova categoria "${nome}" foi adicionada com sucesso`
      });
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      return null;
    }
  };

  const editarCategoria = async (id: number, nome: string) => {
    try {
      const { data, error } = await supabase
        .from('categorias_insumo')
        .update({ nome })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao editar categoria:', error);
        toast({
          title: "Erro ao editar categoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setCategorias(prev => prev.map(cat => cat.id === id ? data as CategoriaInsumoSupabase : cat));
      toast({
        title: "Categoria atualizada",
        description: `A categoria foi atualizada para "${nome}"`
      });
      return true;
    } catch (error) {
      console.error('Erro ao editar categoria:', error);
      return false;
    }
  };

  const removerCategoria = async (id: number) => {
    try {
      const { error } = await supabase
        .from('categorias_insumo')
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
        description: "A categoria foi removida com sucesso"
      });
      return true;
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      return false;
    }
  };

  const getCategoriasPadrao = () => {
    return categorias.filter(cat => cat.tipo === 'padrao');
  };

  const getCategoriasPersonalizadas = () => {
    return categorias.filter(cat => cat.tipo === 'personalizada');
  };

  const getAllCategoriasNomes = () => {
    return categorias.map(cat => cat.nome);
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  return {
    categorias,
    loading,
    carregarCategorias,
    adicionarCategoria,
    editarCategoria,
    removerCategoria,
    getCategoriasPadrao,
    getCategoriasPersonalizadas,
    getAllCategoriasNomes
  };
};
