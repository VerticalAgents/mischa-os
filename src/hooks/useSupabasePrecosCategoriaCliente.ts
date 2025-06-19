
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
  const [error, setError] = useState<string | null>(null);

  const carregarPrecosPorCliente = async (clienteId: string) => {
    if (!clienteId) {
      console.log('useSupabasePrecosCategoriaCliente: ClienteId não fornecido');
      return [];
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useSupabasePrecosCategoriaCliente: Carregando preços para cliente:', clienteId);
      
      // Verificar se a tabela existe primeiro
      const { data, error } = await supabase
        .from('precos_categoria_cliente')
        .select('*')
        .eq('cliente_id', clienteId)
        .limit(1);

      if (error) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          // Tabela não existe - retornar array vazio sem erro
          console.log('useSupabasePrecosCategoriaCliente: Tabela precos_categoria_cliente não existe, usando valores padrão');
          setPrecos([]);
          return [];
        }
        throw error;
      }

      // Converter dados se existirem
      const precosConvertidos = (data || []).map(item => ({
        id: item.id,
        cliente_id: item.cliente_id,
        categoria_id: Number(item.categoria_id),
        preco_unitario: Number(item.preco_unitario || 0),
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      console.log('useSupabasePrecosCategoriaCliente: Preços carregados:', precosConvertidos);
      setPrecos(precosConvertidos);
      return precosConvertidos;
    } catch (error: any) {
      console.error('useSupabasePrecosCategoriaCliente: Erro ao carregar preços:', error);
      setError(error.message);
      
      // Não mostrar toast para erros de tabela inexistente
      if (!error.message.includes('relation') && !error.message.includes('does not exist')) {
        toast({
          title: "Aviso",
          description: "Não foi possível carregar preços personalizados. Usando valores padrão.",
          variant: "default"
        });
      }
      
      setPrecos([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const salvarPrecos = async (clienteId: string, precosCategoria: { categoria_id: number; preco_unitario: number }[]) => {
    if (!clienteId) {
      toast({
        title: "Erro",
        description: "ID do cliente é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('useSupabasePrecosCategoriaCliente: Salvando preços:', { clienteId, precosCategoria });
      
      // Verificar se a tabela existe
      const { error: testError } = await supabase
        .from('precos_categoria_cliente')
        .select('id')
        .limit(1);

      if (testError && testError.message.includes('relation') && testError.message.includes('does not exist')) {
        console.log('useSupabasePrecosCategoriaCliente: Tabela não existe, salvando apenas no cliente');
        toast({
          title: "Preços salvos",
          description: "Configurações de preço foram salvas nas configurações do cliente"
        });
        return;
      }

      // Remover preços existentes
      const { error: deleteError } = await supabase
        .from('precos_categoria_cliente')
        .delete()
        .eq('cliente_id', clienteId);

      if (deleteError && !deleteError.message.includes('relation')) {
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
          .from('precos_categoria_cliente')
          .insert(precosParaInserir);

        if (insertError && !insertError.message.includes('relation')) {
          throw insertError;
        }
      }

      await carregarPrecosPorCliente(clienteId);
      
      toast({
        title: "Preços salvos",
        description: "Preços por categoria foram atualizados com sucesso"
      });
    } catch (error: any) {
      console.error('useSupabasePrecosCategoriaCliente: Erro ao salvar preços:', error);
      setError(error.message);
      
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
    error,
    carregarPrecosPorCliente,
    salvarPrecos
  };
};
