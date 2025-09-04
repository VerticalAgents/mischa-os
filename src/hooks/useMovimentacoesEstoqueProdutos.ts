
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MovTipo, asMovTipo, MovimentacaoEstoqueProduto } from '@/types/estoque';

export const useMovimentacoesEstoqueProdutos = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoqueProduto[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarMovimentacoes = async (produtoId?: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from('movimentacoes_estoque_produtos')
        .select('*')
        .order('data_movimentacao', { ascending: false })
        .order('created_at', { ascending: false });

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
      const rows = (data ?? []).map(r => ({ ...r, tipo: asMovTipo(r.tipo as any) })) as MovimentacaoEstoqueProduto[];
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

  const obterQuantidadeSeparada = async (produtoId: string): Promise<number> => {
    try {
      // Buscar todos os agendamentos com status "Separado"
      const { data: agendamentos, error } = await supabase
        .from('agendamentos_clientes')
        .select('*')
        .eq('substatus_pedido', 'Separado');

      if (error) {
        console.error('Erro ao buscar agendamentos separados:', error);
        return 0;
      }

      let quantidadeSeparada = 0;

      // Para cada agendamento separado, verificar se contém o produto
      for (const agendamento of agendamentos || []) {
        if (agendamento.tipo_pedido === 'Alterado' && Array.isArray(agendamento.itens_personalizados)) {
          // Para pedidos alterados, usar itens personalizados
          const item = agendamento.itens_personalizados.find((item: any) => item.produto === produtoId);
          if (item && typeof item === 'object' && 'quantidade' in item) {
            quantidadeSeparada += (item as any).quantidade || 0;
          }
        } else {
          // Para pedidos padrão, assumir que usa a quantidade total
          // Aqui seria necessário buscar informações do produto padrão do cliente
          // Por simplicidade, vamos assumir que a quantidade_total se refere ao produto específico
          // Esta lógica pode ser refinada baseada na estrutura real dos dados
        }
      }

      return quantidadeSeparada;
    } catch (error) {
      console.error('Erro ao obter quantidade separada:', error);
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
    obterSaldoProduto,
    obterQuantidadeSeparada
  };
};
