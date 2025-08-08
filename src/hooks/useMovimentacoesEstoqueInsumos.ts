
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MovTipo, asMovTipo } from '@/types/estoque';

export interface MovimentacaoEstoqueInsumo {
  id: string;
  insumo_id: string;
  tipo: MovTipo;
  quantidade: number;
  data_movimentacao: string;
  observacao?: string;
  created_at: string;
}

export const useMovimentacoesEstoqueInsumos = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoqueInsumo[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarMovimentacoes = async (insumoId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('movimentacoes_estoque_insumos')
        .select('*')
        .order('data_movimentacao', { ascending: false });

      if (insumoId) {
        query = query.eq('insumo_id', insumoId);
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

  const adicionarMovimentacao = async (movimentacao: Omit<MovimentacaoEstoqueInsumo, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('movimentacoes_estoque_insumos')
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

  const obterSaldoInsumo = async (insumoId: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('saldo_insumo', {
        i_id: insumoId
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
    obterSaldoInsumo
  };
};
