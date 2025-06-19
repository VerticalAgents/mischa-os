
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PrecoCategoriaCliente {
  id: string;
  cliente_id: string;
  categoria_id: number;
  preco_unitario: number;
  created_at: string;
  updated_at: string;
}

export const useSupabasePrecosCategoriaCliente = () => {
  const [precos, setPrecos] = useState<PrecoCategoriaCliente[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarPrecosPorCliente = async (clienteId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('precos_categoria_cliente' as any)
        .select('*')
        .eq('cliente_id', clienteId);

      if (error) {
        console.error('Erro ao carregar preços por categoria:', error);
        toast({
          title: "Erro ao carregar preços",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }

      const precosConvertidos = (data as any[])?.map(item => ({
        id: item.id,
        cliente_id: item.cliente_id,
        categoria_id: item.categoria_id,
        preco_unitario: Number(item.preco_unitario),
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      setPrecos(precosConvertidos);
      return precosConvertidos;
    } catch (error) {
      console.error('Erro ao carregar preços por categoria:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const salvarPrecos = async (clienteId: string, precosCategoria: { categoria_id: number; preco_unitario: number }[]) => {
    setLoading(true);
    try {
      // Primeiro, remover preços existentes
      const { error: deleteError } = await supabase
        .from('precos_categoria_cliente' as any)
        .delete()
        .eq('cliente_id', clienteId);

      if (deleteError) {
        console.error('Erro ao remover preços antigos:', deleteError);
        throw deleteError;
      }

      // Inserir novos preços apenas para categorias com preço > 0
      const precosParaInserir = precosCategoria
        .filter(p => p.preco_unitario > 0)
        .map(p => ({
          cliente_id: clienteId,
          categoria_id: p.categoria_id,
          preco_unitario: p.preco_unitario
        }));

      if (precosParaInserir.length > 0) {
        const { error: insertError } = await supabase
          .from('precos_categoria_cliente' as any)
          .insert(precosParaInserir);

        if (insertError) {
          console.error('Erro ao inserir preços:', insertError);
          throw insertError;
        }
      }

      await carregarPrecosPorCliente(clienteId);
      
      toast({
        title: "Preços salvos",
        description: "Preços por categoria foram atualizados com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar preços:', error);
      toast({
        title: "Erro ao salvar preços",
        description: "Não foi possível salvar os preços por categoria",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    precos,
    loading,
    carregarPrecosPorCliente,
    salvarPrecos
  };
};
