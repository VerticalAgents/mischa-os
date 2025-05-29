
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CategoriasProdutoSupabase {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCategoriasProduto = () => {
  const [categorias, setCategorias] = useState<CategoriasProdutoSupabase[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarCategorias = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categorias_produto' as any)
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

  useEffect(() => {
    carregarCategorias();
  }, []);

  return {
    categorias,
    loading,
    carregarCategorias
  };
};
