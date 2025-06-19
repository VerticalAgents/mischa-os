
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ClienteCategoria {
  id: string;
  cliente_id: string;
  categoria_id: number;
  created_at: string;
}

export const useClientesCategorias = () => {
  const [loading, setLoading] = useState(false);

  const salvarCategoriasCliente = async (clienteId: string, categoriaIds: number[]) => {
    setLoading(true);
    try {
      console.log(`useClientesCategorias: Salvando categorias para cliente ${clienteId}:`, categoriaIds);

      // Primeiro, remover todas as categorias existentes do cliente
      const { error: deleteError } = await supabase
        .from('clientes_categorias')
        .delete()
        .eq('cliente_id', clienteId);

      if (deleteError) {
        console.error('Erro ao remover categorias existentes:', deleteError);
        throw deleteError;
      }

      // Se há categorias para salvar, inserir as novas
      if (categoriaIds.length > 0) {
        const novasRelacoes = categoriaIds.map(categoriaId => ({
          cliente_id: clienteId,
          categoria_id: categoriaId
        }));

        const { error: insertError } = await supabase
          .from('clientes_categorias')
          .insert(novasRelacoes);

        if (insertError) {
          console.error('Erro ao inserir novas categorias:', insertError);
          throw insertError;
        }
      }

      // Também atualizar o campo JSONB na tabela clientes para compatibilidade
      const { error: updateError } = await supabase
        .from('clientes')
        .update({ categorias_habilitadas: categoriaIds })
        .eq('id', clienteId);

      if (updateError) {
        console.error('Erro ao atualizar campo categorias_habilitadas:', updateError);
        throw updateError;
      }

      console.log('useClientesCategorias: Categorias salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar categorias do cliente:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as categorias do cliente",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const carregarCategoriasCliente = async (clienteId: string): Promise<number[]> => {
    try {
      console.log(`useClientesCategorias: Carregando categorias para cliente ${clienteId}`);

      const { data, error } = await supabase
        .from('clientes_categorias')
        .select('categoria_id')
        .eq('cliente_id', clienteId);

      if (error) {
        console.error('Erro ao carregar categorias do cliente:', error);
        throw error;
      }

      const categoriaIds = data?.map(item => item.categoria_id) || [];
      console.log(`useClientesCategorias: Categorias carregadas:`, categoriaIds);
      
      return categoriaIds;
    } catch (error) {
      console.error('Erro ao carregar categorias do cliente:', error);
      return [];
    }
  };

  return {
    loading,
    salvarCategoriasCliente,
    carregarCategoriasCliente
  };
};
