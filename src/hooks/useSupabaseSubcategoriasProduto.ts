
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SubcategoriaProduto {
  id: number;
  nome: string;
  descricao?: string;
  categoria_id: number;
  ativo: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseSubcategoriasProduto = () => {
  const [subcategorias, setSubcategorias] = useState<SubcategoriaProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarSubcategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subcategorias_produto')
        .select('*')
        .eq('ativo', true)
        .order('categoria_id, nome');

      if (error) {
        console.error('Erro ao carregar subcategorias:', error);
        return;
      }

      setSubcategorias((data as any[]) || []);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const adicionarSubcategoria = async (subcategoria: {
    nome: string;
    descricao?: string;
    categoria_id: number;
  }) => {
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
        .insert([{ ...subcategoria, user_id: user.id }])
        .select()
        .single();

      if (error) {
        toast({
          title: "Erro ao criar subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Subcategoria criada",
        description: "Subcategoria criada com sucesso"
      });

      await carregarSubcategorias();
      return data;
    } catch (error) {
      console.error('Erro ao adicionar subcategoria:', error);
      return null;
    }
  };

  const getSubcategoriasPorCategoria = (categoriaId: number) => {
    return subcategorias.filter(sub => sub.categoria_id === categoriaId);
  };

  useEffect(() => {
    carregarSubcategorias();
  }, []);

  return {
    subcategorias,
    loading,
    carregarSubcategorias,
    adicionarSubcategoria,
    getSubcategoriasPorCategoria,
  };
};
