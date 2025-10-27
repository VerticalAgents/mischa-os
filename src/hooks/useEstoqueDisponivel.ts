import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useQuantidadesSeparadas } from './useQuantidadesSeparadas';
import { supabase } from '@/integrations/supabase/client';

export interface ProdutoEstoqueDisponivel {
  produto_id: string;
  produto_nome: string;
  saldo_atual: number;
  quantidade_separada: number;
  quantidade_despachada: number;
  quantidade_necessaria: number;
  estoque_disponivel: number;
  estoque_minimo: number;
  estoque_ideal: number;
  status: 'critico' | 'baixo' | 'adequado' | 'excesso';
}

interface QuantidadesNecessarias {
  [produto_id: string]: number;
}

export const useEstoqueDisponivel = (quantidadesNecessarias: QuantidadesNecessarias = {}) => {
  const { produtos: produtosBase, loading: loadingProdutos } = useSupabaseProdutos();
  const { pedidos, carregarPedidos } = useExpedicaoStore();
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isLoadingRef = useRef(false);

  // Separar pedidos por status
  const pedidosSeparados = useMemo(() => {
    return pedidos.filter(p => p.substatus_pedido === 'Separado');
  }, [pedidos]);

  const pedidosDespachados = useMemo(() => {
    return pedidos.filter(p => p.substatus_pedido === 'Despachado');
  }, [pedidos]);

  // Obter quantidades separadas e despachadas
  const { quantidadesPorProduto, calculando: calculandoExpedicao } = 
    useQuantidadesSeparadas(pedidosSeparados, pedidosDespachados);

  // Carregar pedidos se necessário
  useEffect(() => {
    if (pedidos.length === 0) {
      console.log('📦 [EstoqueDisponivel] Carregando pedidos da expedição...');
      carregarPedidos();
    }
  }, [pedidos.length, carregarPedidos]);

  // Carregar saldos dos produtos
  const carregarSaldos = useCallback(async () => {
    if (isLoadingRef.current) {
      console.log('⏳ [EstoqueDisponivel] Carregamento já em andamento, ignorando...');
      return;
    }

    if (produtosBase.length === 0) {
      console.log('ℹ️ [EstoqueDisponivel] Nenhum produto para carregar saldos');
      setSaldos({});
      setLoading(false);
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    setError(false);

    console.log('🔄 [EstoqueDisponivel] Carregando saldos de', produtosBase.length, 'produtos...');

    try {
      // Carregar saldos em paralelo usando Promise.all
      const saldosPromises = produtosBase.map(async (produto) => {
        try {
          const { data, error } = await supabase.rpc('saldo_produto', {
            p_id: produto.id
          });

          if (error) {
            console.error('❌ Erro ao obter saldo do produto', produto.nome, ':', error);
            return { id: produto.id, saldo: 0 };
          }

          return { id: produto.id, saldo: data || 0 };
        } catch (err) {
          console.error('❌ Erro ao processar produto', produto.nome, ':', err);
          return { id: produto.id, saldo: 0 };
        }
      });

      const resultados = await Promise.all(saldosPromises);

      const novosSaldos: Record<string, number> = {};
      resultados.forEach(({ id, saldo }) => {
        novosSaldos[id] = saldo;
      });

      console.log('✅ [EstoqueDisponivel] Saldos carregados:', novosSaldos);
      setSaldos(novosSaldos);
      setError(false);
    } catch (err) {
      console.error('❌ [EstoqueDisponivel] Erro ao carregar saldos:', err);
      setError(true);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [produtosBase]);

  // Carregar saldos quando produtos mudarem
  useEffect(() => {
    if (!loadingProdutos && produtosBase.length > 0) {
      carregarSaldos();
    }
  }, [loadingProdutos, carregarSaldos]);

  // Calcular produtos com estoque disponível
  const produtosComEstoque = useMemo((): ProdutoEstoqueDisponivel[] => {
    if (loadingProdutos || loading) {
      console.log('⏳ [EstoqueDisponivel] Aguardando carregamento...');
      return [];
    }

    console.log('🔄 [EstoqueDisponivel] Calculando estoque disponível...', {
      produtos: produtosBase.length,
      saldos: Object.keys(saldos).length,
      quantidades: Object.keys(quantidadesPorProduto).length,
      necessarias: Object.keys(quantidadesNecessarias).length
    });

    return produtosBase
      .filter(p => p.ativo)
      .map(produto => {
        const saldo_atual = saldos[produto.id] || 0;
        const quantidade_separada = quantidadesPorProduto[produto.nome] || 0;
        const quantidade_despachada = 0; // Já incluído em quantidadesPorProduto
        const quantidade_necessaria = quantidadesNecessarias[produto.id] || 0;
        
        // Calcular disponível: saldo - (separado + necessário para produção)
        const estoque_disponivel = saldo_atual - quantidade_separada - quantidade_necessaria;

        let status: 'critico' | 'baixo' | 'adequado' | 'excesso' = 'adequado';
        if (estoque_disponivel < 0) {
          status = 'critico';
        } else if (estoque_disponivel < (produto.estoque_minimo || 0)) {
          status = 'baixo';
        } else if (estoque_disponivel > (produto.estoque_ideal || produto.estoque_minimo || 0)) {
          status = 'excesso';
        }

        return {
          produto_id: produto.id,
          produto_nome: produto.nome,
          saldo_atual,
          quantidade_separada,
          quantidade_despachada,
          quantidade_necessaria,
          estoque_disponivel,
          estoque_minimo: produto.estoque_minimo || 0,
          estoque_ideal: produto.estoque_ideal || 0,
          status
        };
      })
      .sort((a, b) => a.estoque_disponivel - b.estoque_disponivel);
  }, [produtosBase, saldos, quantidadesPorProduto, quantidadesNecessarias, loadingProdutos, loading]);

  // Calcular totais
  const totalDisponivel = useMemo(() => {
    return produtosComEstoque.reduce((sum, p) => sum + p.estoque_disponivel, 0);
  }, [produtosComEstoque]);

  const totalSeparado = useMemo(() => {
    return produtosComEstoque.reduce((sum, p) => sum + p.quantidade_separada, 0);
  }, [produtosComEstoque]);

  const totalDespachado = useMemo(() => {
    return produtosComEstoque.reduce((sum, p) => sum + p.quantidade_despachada, 0);
  }, [produtosComEstoque]);

  const totalNecessario = useMemo(() => {
    return produtosComEstoque.reduce((sum, p) => sum + p.quantidade_necessaria, 0);
  }, [produtosComEstoque]);

  const recarregar = useCallback(async () => {
    console.log('🔄 [EstoqueDisponivel] Recarregando dados...');
    await carregarPedidos();
    await carregarSaldos();
  }, [carregarPedidos, carregarSaldos]);

  return {
    produtos: produtosComEstoque,
    loading: loadingProdutos || loading || calculandoExpedicao,
    error,
    totalDisponivel,
    totalSeparado,
    totalDespachado,
    totalNecessario,
    recarregar
  };
};
