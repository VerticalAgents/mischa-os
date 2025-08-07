
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ProdutoSupabase {
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
}

export const useSupabaseProdutos = () => {
  const [produtos, setProdutos] = useState<ProdutoSupabase[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('produtos_finais')
        .select('*')
        .order('nome');

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setProdutos(data || []);
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

  useEffect(() => {
    carregarProdutos();
  }, []);

  return {
    produtos,
    loading,
    carregarProdutos
  };
};
