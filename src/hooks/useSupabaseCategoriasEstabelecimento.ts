
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CategoriaEstabelecimento {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCategoriasEstabelecimento = () => {
  const [categorias, setCategorias] = useState<CategoriaEstabelecimento[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) {
        console.error('Erro ao carregar categorias de estabelecimento:', error);
        return;
      }

      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias de estabelecimento:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarCategoria = async (categoria: {
    nome: string;
    descricao?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('categorias_estabelecimento')
        .insert(categoria)
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar categoria",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Categoria criada",
        description: "Categoria criada com sucesso"
      });

      await carregarCategorias();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      return null;
    }
  };

  const atualizarCategoria = async (id: number, updates: Partial<CategoriaEstabelecimento>) => {
    try {
      const { error } = await supabase
        .from('categorias_estabelecimento')
        .update(updates)
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao atualizar categoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Categoria atualizada",
        description: "Categoria atualizada com sucesso"
      });

      await carregarCategorias();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return false;
    }
  };

  const removerCategoria = async (id: number) => {
    try {
      const { error } = await supabase
        .from('categorias_estabelecimento')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        toast({
          title: "Erro ao remover categoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Categoria removida",
        description: "Categoria removida com sucesso"
      });

      await carregarCategorias();
      return true;
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      return false;
    }
  };

  useEffect(() => {
    carregarCategorias();
  }, []);

  return {
    categorias,
    loading,
    carregarCategorias,
    adicionarCategoria,
    atualizarCategoria,
    removerCategoria,
  };
};
