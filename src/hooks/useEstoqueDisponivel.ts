import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useMovimentacoesEstoqueProdutos } from './useMovimentacoesEstoqueProdutos';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useQuantidadesExpedicao } from './useQuantidadesExpedicao';

export interface ProdutoEstoqueDisponivel {
  produto_id: string;
  produto_nome: string;
  saldo_atual: number;
  quantidade_separada: number;
  quantidade_despachada: number;
  estoque_disponivel: number;
  estoque_minimo: number;
  estoque_ideal: number;
}

export const useEstoqueDisponivel = () => {
  const { produtos: produtosBase, loading: loadingProdutos } = useSupabaseProdutos();
  const { obterSaldoProduto } = useMovimentacoesEstoqueProdutos();
  const { pedidos, carregarPedidos, isLoading: loadingExpedicao } = useExpedicaoStore();
  
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [parcial, setParcial] = useState(false);

  console.log('[EstoqueDisponivel] Hook iniciado', {
    produtosBase: produtosBase.length,
    loadingProdutos,
    pedidos: pedidos.length,
    loading,
    loadingExpedicao
  });

  // Filtrar pedidos separados e despachados
  const pedidosSeparados = useMemo(
    () => pedidos.filter((p) => p.substatus_pedido === "Separado"),
    [pedidos]
  );

  const pedidosDespachados = useMemo(
    () => pedidos.filter((p) => p.substatus_pedido === "Despachado"),
    [pedidos]
  );

  console.log('[EstoqueDisponivel] Pedidos filtrados', {
    separados: pedidosSeparados.length,
    despachados: pedidosDespachados.length
  });

  // Garantir que pedidos da expedição estejam carregados neste contexto
  useEffect(() => {
    if (pedidos.length === 0 && !loadingExpedicao) {
      console.log('[EstoqueDisponivel] Nenhum pedido na store; carregando pedidos de expedição...');
      carregarPedidos().catch(err => console.error('[EstoqueDisponivel] Erro ao carregar pedidos:', err));
    }
  }, [pedidos.length, loadingExpedicao, carregarPedidos]);

  // Usar hook para calcular quantidades de expedição
  const {
    quantidadesSeparadas,
    quantidadesDespachadas,
    calculando: calculandoExpedicao,
    obterQuantidadeSeparada,
    obterQuantidadeDespachada
  } = useQuantidadesExpedicao(pedidosSeparados, pedidosDespachados);

  // Atualizar indicador de dados parciais
  useEffect(() => {
    setParcial(calculandoExpedicao);
    console.log('[EstoqueDisponivel] Estado parcial:', calculandoExpedicao);
  }, [calculandoExpedicao]);

  // Carregar saldos de produtos
  const carregarSaldos = useCallback(async () => {
    if (produtosBase.length === 0) {
      console.log('[EstoqueDisponivel] Nenhum produto, finalizando loading');
      setSaldos({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    try {
      console.log('[EstoqueDisponivel] Carregando saldos para', produtosBase.length, 'produtos');
      
      // Carregar saldos em paralelo
      const saldosPromises = produtosBase
        .filter(p => p.ativo)
        .map(async (produto) => {
          try {
            const saldo = await obterSaldoProduto(produto.id);
            console.log(`[EstoqueDisponivel] Saldo carregado para ${produto.nome}:`, saldo);
            return { id: produto.id, saldo };
          } catch (err) {
            console.error(`[EstoqueDisponivel] Erro ao obter saldo do produto ${produto.nome}:`, err);
            return { id: produto.id, saldo: 0 };
          }
        });

      const saldosResultados = await Promise.all(saldosPromises);
      
      const saldosMap: Record<string, number> = {};
      saldosResultados.forEach(({ id, saldo }) => {
        saldosMap[id] = saldo;
      });

      setSaldos(saldosMap);
      console.log('[EstoqueDisponivel] Saldos carregados:', saldosMap);
    } catch (err) {
      console.error('[EstoqueDisponivel] Erro ao carregar saldos:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [produtosBase, obterSaldoProduto]);

  // Carregar saldos quando produtos mudarem
  useEffect(() => {
    carregarSaldos();
  }, [carregarSaldos]);

  // Timeout de segurança para evitar loading infinito
  useEffect(() => {
    if (!loading) return;
    const timeout = setTimeout(() => {
      console.warn('[EstoqueDisponivel] Timeout no carregamento de saldos (15s), finalizando com erro');
      setLoading(false);
      setError(true);
    }, 15000);
    return () => clearTimeout(timeout);
  }, [loading]);

  // Processar dados para o formato final
  const produtosComEstoque = useMemo((): ProdutoEstoqueDisponivel[] => {
    if (loadingProdutos || loading) {
      console.log('[EstoqueDisponivel] Aguardando dados base...', { loadingProdutos, loading });
      return [];
    }

    console.log('[EstoqueDisponivel] Processando produtos com estoque...', {
      produtosAtivos: produtosBase.filter(p => p.ativo).length,
      saldosCarregados: Object.keys(saldos).length,
      calculandoExpedicao
    });
    
    return produtosBase
      .filter(p => p.ativo)
      .map(produto => {
        const saldo_atual = saldos[produto.id] || 0;
        const quantidade_separada = calculandoExpedicao ? 0 : obterQuantidadeSeparada(produto.nome);
        const quantidade_despachada = calculandoExpedicao ? 0 : obterQuantidadeDespachada(produto.nome);
        const estoque_disponivel = saldo_atual - (quantidade_separada + quantidade_despachada);

        console.log(`[EstoqueDisponivel] Produto ${produto.nome}:`, {
          saldo_atual,
          quantidade_separada,
          quantidade_despachada,
          estoque_disponivel
        });

        return {
          produto_id: produto.id,
          produto_nome: produto.nome,
          saldo_atual,
          quantidade_separada,
          quantidade_despachada,
          estoque_disponivel,
          estoque_minimo: produto.estoque_minimo || 0,
          estoque_ideal: produto.estoque_ideal || 0
        };
      })
      .sort((a, b) => a.produto_nome.localeCompare(b.produto_nome));
  }, [produtosBase, saldos, loadingProdutos, loading, calculandoExpedicao, obterQuantidadeSeparada, obterQuantidadeDespachada]);

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

  console.log('[EstoqueDisponivel] Retornando:', {
    produtos: produtosComEstoque.length,
    loading: loadingProdutos || loading,
    parcial,
    error,
    totalDisponivel,
    totalSeparado,
    totalDespachado
  });

  return {
    produtos: produtosComEstoque,
    loading: loadingProdutos || loading,
    parcial,
    error,
    totalDisponivel,
    totalSeparado,
    totalDespachado,
    recarregar: carregarSaldos
  };
};
