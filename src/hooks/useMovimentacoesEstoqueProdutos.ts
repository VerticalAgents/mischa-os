
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MovTipo, asMovTipo } from '@/types/estoque';

export interface MovimentacaoEstoqueProduto {
  id: string;
  produto_id: string;
  tipo: MovTipo;
  quantidade: number;
  data_movimentacao: string;
  observacao?: string;
  created_at: string;
}

export const useMovimentacoesEstoqueProdutos = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoqueProduto[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarMovimentacoes = async (produtoId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('movimentacoes_estoque_produtos')
        .select('*')
        .order('data_movimentacao', { ascending: false });

      if (produtoId) {
        query = query.eq('produto_id', produtoId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar movimentações:', error);
        toast({
          title: "Erro ao carregar movimentações",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Normalizar tipo antes do setState
      const rows = (data ?? []).map(r => ({ ...r, tipo: asMovTipo(r.tipo as any) }));
      setMovimentacoes(rows);
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
      toast({
        title: "Erro ao carregar movimentações",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const adicionarMovimentacao = async (movimentacao: Omit<MovimentacaoEstoqueProduto, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque_produtos')
        .insert([movimentacao])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar movimentação:', error);
        
        // Verificar se é erro de saldo insuficiente
        if (error.message.includes('Saldo insuficiente')) {
          toast({
            title: "Saldo insuficiente",
            description: error.message,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Erro ao adicionar movimentação",
            description: error.message,
            variant: "destructive"
          });
        }
        return false;
      }

      toast({
        title: "Movimentação registrada",
        description: `${movimentacao.tipo === 'entrada' ? 'Entrada' : movimentacao.tipo === 'saida' ? 'Saída' : 'Ajuste'} registrada com sucesso`,
      });

      await carregarMovimentacoes();
      return true;
    } catch (error) {
      console.error('Erro ao adicionar movimentação:', error);
      toast({
        title: "Erro ao adicionar movimentação",
        description: "Ocorreu um erro inesperado",
        variant: "destructive"
      });
      return false;
    }
  };

  const obterSaldoProduto = async (produtoId: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('saldo_produto', {
        p_id: produtoId
      });

      if (error) {
        console.error('Erro ao obter saldo:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Erro ao obter saldo:', error);
      return 0;
    }
  };

  useEffect(() => {
    carregarMovimentacoes();
  }, []);

  return {
    movimentacoes,
    loading,
    carregarMovimentacoes,
    adicionarMovimentacao,
    obterSaldoProduto
  };
};
