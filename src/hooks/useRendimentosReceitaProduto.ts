
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface RendimentoReceitaProduto {
  id: string;
  receita_id: string;
  produto_id: string;
  rendimento: number;
  created_at: string;
  updated_at: string;
}

export const useRendimentosReceitaProduto = () => {
  const [rendimentos, setRendimentos] = useState<RendimentoReceitaProduto[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarRendimentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rendimentos_receita_produto')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar rendimentos:', error);
        return;
      }

      setRendimentos(data || []);
    } catch (error) {
      console.error('Erro ao carregar rendimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const salvarRendimento = async (receitaId: string, produtoId: string, rendimento: number) => {
    try {
      const { error } = await supabase
        .from('rendimentos_receita_produto')
        .upsert({
          receita_id: receitaId,
          produto_id: produtoId,
          rendimento: rendimento,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar rendimento:', error);
        toast({
          title: "Erro ao salvar rendimento",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Rendimento salvo",
        description: "Rendimento atualizado com sucesso"
      });

      await carregarRendimentos();
      return true;
    } catch (error) {
      console.error('Erro ao salvar rendimento:', error);
      toast({
        title: "Erro ao salvar rendimento",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const removerRendimento = async (rendimentoId: string) => {
    try {
      const { error } = await supabase
        .from('rendimentos_receita_produto')
        .delete()
        .eq('id', rendimentoId);

      if (error) {
        console.error('Erro ao remover rendimento:', error);
        toast({
          title: "Erro ao remover rendimento",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Rendimento removido",
        description: "Vínculo removido com sucesso"
      });

      await carregarRendimentos();
      return true;
    } catch (error) {
      console.error('Erro ao remover rendimento:', error);
      toast({
        title: "Erro ao remover rendimento",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const obterRendimentoPorReceita = (receitaId: string) => {
    return rendimentos.filter(r => r.receita_id === receitaId);
  };

  const obterRendimento = (receitaId: string, produtoId: string) => {
    return rendimentos.find(r => r.receita_id === receitaId && r.produto_id === produtoId);
  };

  useEffect(() => {
    carregarRendimentos();
  }, []);

  return {
    rendimentos,
    loading,
    carregarRendimentos,
    salvarRendimento,
    removerRendimento,
    obterRendimentoPorReceita,
    obterRendimento
  };
};
