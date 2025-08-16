
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface EstoqueConsolidado {
  produto_id: string;
  produto_nome: string;
  saldoContabil: number;
  reservadoAtivo: number;
  saldoReal: number;
}

export const useEstoqueConsolidado = (produtoIds: string[]) => {
  const [estoques, setEstoques] = useState<EstoqueConsolidado[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarEstoques = async () => {
    if (produtoIds.length === 0) {
      setEstoques([]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Carregando estoques consolidados para produtos:', produtoIds);

      // 1. Buscar saldos contábeis via RPC
      const saldosContabeis = new Map<string, number>();
      for (const produtoId of produtoIds) {
        const { data: saldo, error } = await supabase.rpc('saldo_produto', {
          p_id: produtoId
        });
        if (error) {
          console.error('Erro ao obter saldo contábil:', error);
          saldosContabeis.set(produtoId, 0);
        } else {
          saldosContabeis.set(produtoId, Number(saldo || 0));
        }
      }

      // 2. Buscar nomes dos produtos
      const { data: produtos, error: produtosError } = await supabase
        .from('produtos_finais')
        .select('id, nome')
        .in('id', produtoIds);

      if (produtosError) {
        console.error('Erro ao buscar produtos:', produtosError);
        return;
      }

      const nomeProdutos = new Map(produtos?.map(p => [p.id, p.nome]) || []);

      // 3. Buscar movimentações de reserva dos últimos 90 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 90);

      const { data: reservas, error: reservasError } = await supabase
        .from('movimentacoes_estoque_produtos')
        .select('produto_id, quantidade, tipo')
        .in('produto_id', produtoIds)
        .eq('referencia_tipo', 'reserva')
        .in('tipo', ['reserva', 'reserva_cancelada', 'reserva_consumida'])
        .gte('data_movimentacao', dataLimite.toISOString());

      if (reservasError) {
        console.error('Erro ao buscar reservas:', reservasError);
        return;
      }

      // 4. Calcular reservado ativo por produto
      const reservadoPorProduto = new Map<string, number>();
      
      (reservas || []).forEach(mov => {
        const atual = reservadoPorProduto.get(mov.produto_id) || 0;
        
        if (mov.tipo === 'reserva') {
          reservadoPorProduto.set(mov.produto_id, atual + Number(mov.quantidade));
        } else if (mov.tipo === 'reserva_cancelada' || mov.tipo === 'reserva_consumida') {
          reservadoPorProduto.set(mov.produto_id, atual - Number(mov.quantidade));
        }
      });

      // 5. Consolidar dados
      const estoquesConsolidados = produtoIds.map(produtoId => {
        const saldoContabil = saldosContabeis.get(produtoId) || 0;
        const reservadoAtivo = Math.max(reservadoPorProduto.get(produtoId) || 0, 0);
        const saldoReal = Math.max(saldoContabil - reservadoAtivo, 0);

        return {
          produto_id: produtoId,
          produto_nome: nomeProdutos.get(produtoId) || 'Produto não encontrado',
          saldoContabil,
          reservadoAtivo,
          saldoReal
        };
      });

      console.log('📊 Estoques consolidados calculados:', estoquesConsolidados);
      setEstoques(estoquesConsolidados);
    } catch (error) {
      console.error('Erro ao carregar estoques consolidados:', error);
      setEstoques([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstoques();
  }, [JSON.stringify(produtoIds.sort())]);

  return {
    estoques,
    loading,
    recarregar: carregarEstoques,
    obterEstoqueProduto: (produtoId: string) => 
      estoques.find(e => e.produto_id === produtoId) || {
        produto_id: produtoId,
        produto_nome: 'Carregando...',
        saldoContabil: 0,
        reservadoAtivo: 0,
        saldoReal: 0
      }
  };
};
