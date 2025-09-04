
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MovTipo, asMovTipo, MovimentacaoEstoqueProduto } from '@/types/estoque';
import { useProporoesPadrao } from './useProporoesPadrao';
import { useEstoqueProdutos } from './useEstoqueProdutos';

export const useMovimentacoesEstoqueProdutos = () => {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoqueProduto[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Mover os hooks para o nível do componente
  const { calcularQuantidadesPorProporcao } = useProporoesPadrao();
  const { produtos } = useEstoqueProdutos();

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
      // Buscar apenas os agendamentos com status "Separado" (não incluir despachados)
      const { data: agendamentos, error } = await supabase
        .from('agendamentos_clientes')
        .select('*')
        .eq('substatus_pedido', 'Separado');

      if (error) {
        console.error('Erro ao buscar agendamentos separados:', error);
        return 0;
      }

      // Encontrar o produto pelo ID para obter o nome
      const produto = produtos.find(p => p.id === produtoId);
      if (!produto) {
        console.warn('Produto não encontrado:', produtoId);
        return 0;
      }
      
      const nomeProduto = produto.nome;
      let quantidadeSeparada = 0;

      // Usar a mesma lógica do ResumoUnidadesSeparadas
      for (const agendamento of agendamentos || []) {
        if (agendamento.tipo_pedido === 'Alterado' && Array.isArray(agendamento.itens_personalizados) && agendamento.itens_personalizados.length > 0) {
          // Pedido alterado - usar itens personalizados
          const item = (agendamento.itens_personalizados as any[]).find((item: any) => item.produto === produtoId || item.produto === nomeProduto);
          if (item) {
            quantidadeSeparada += item.quantidade || 0;
          }
        } else {
          // Pedido padrão - usar proporções cadastradas
          try {
            const quantidadesProporcao = await calcularQuantidadesPorProporcao(agendamento.quantidade_total);
            const itemProduto = quantidadesProporcao.find(item => item.produto === nomeProduto);
            if (itemProduto) {
              quantidadeSeparada += itemProduto.quantidade || 0;
            }
          } catch (error) {
            console.warn('Erro ao calcular proporções para pedido:', agendamento.id, error);
            
            // Fallback: distribuir igualmente entre produtos ativos
            const produtosAtivos = produtos.filter(p => p.ativo);
            if (produtosAtivos.length > 0) {
              const quantidadePorProduto = Math.floor(agendamento.quantidade_total / produtosAtivos.length);
              const resto = agendamento.quantidade_total % produtosAtivos.length;
              
              const indexProduto = produtosAtivos.findIndex(p => p.nome === nomeProduto);
              if (indexProduto !== -1) {
                const quantidade = quantidadePorProduto + (indexProduto < resto ? 1 : 0);
                quantidadeSeparada += quantidade;
              }
            }
          }
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
