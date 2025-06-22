
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SubcategoriaCusto {
  id: string;
  nome: string;
  tipo: 'fixo' | 'variavel';
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseSubcategoriasCustos = () => {
  const [subcategorias, setSubcategorias] = useState<SubcategoriaCusto[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarSubcategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subcategorias_custos')
        .select('*')
        .eq('ativo', true)
        .order('tipo')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar subcategorias:', error);
        toast({
          title: "Erro ao carregar subcategorias",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Type assertion para garantir que o tipo seja reconhecido corretamente
      setSubcategorias((data || []) as SubcategoriaCusto[]);
    } catch (error) {
      console.error('Erro ao carregar subcategorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const criarSubcategoria = async (nome: string, tipo: 'fixo' | 'variavel') => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_custos')
        .insert([{ nome, tipo }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar subcategoria:', error);
        toast({
          title: "Erro ao criar subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Type assertion para o novo item
      setSubcategorias(prev => [...prev, data as SubcategoriaCusto]);
      toast({
        title: "Subcategoria criada com sucesso",
        variant: "default"
      });
      return true;
    } catch (error) {
      console.error('Erro ao criar subcategoria:', error);
      return false;
    }
  };

  const editarSubcategoria = async (id: string, nome: string, tipo: 'fixo' | 'variavel') => {
    try {
      const { data, error } = await supabase
        .from('subcategorias_custos')
        .update({ nome, tipo })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao editar subcategoria:', error);
        toast({
          title: "Erro ao editar subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      // Type assertion para o item editado
      setSubcategorias(prev => 
        prev.map(sub => sub.id === id ? data as SubcategoriaCusto : sub)
      );
      toast({
        title: "Subcategoria editada com sucesso",
        variant: "default"
      });
      return true;
    } catch (error) {
      console.error('Erro ao editar subcategoria:', error);
      return false;
    }
  };

  const deletarSubcategoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subcategorias_custos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar subcategoria:', error);
        toast({
          title: "Erro ao deletar subcategoria",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      setSubcategorias(prev => prev.filter(sub => sub.id !== id));
      toast({
        title: "Subcategoria deletada com sucesso",
        variant: "default"
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar subcategoria:', error);
      return false;
    }
  };

  const obterSubcategoriasPorTipo = (tipo: 'fixo' | 'variavel') => {
    return subcategorias.filter(sub => sub.tipo === tipo);
  };

  useEffect(() => {
    carregarSubcategorias();
  }, []);

  return {
    subcategorias,
    loading,
    carregarSubcategorias,
    criarSubcategoria,
    editarSubcategoria,
    deletarSubcategoria,
    obterSubcategoriasPorTipo
  };
};
