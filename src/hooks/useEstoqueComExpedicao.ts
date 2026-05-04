import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useMovimentacoesEstoqueProdutos } from './useMovimentacoesEstoqueProdutos';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useQuantidadesExpedicao } from './useQuantidadesExpedicao';

export interface ProdutoComEstoqueDetalhado {
  id: string;
  nome: string;
  categoria_id?: number;
  saldoAtual: number;
  quantidadeSeparada: number;
  quantidadeDespachada: number;
  saldoReal: number;
  ativo: boolean;
  estoqueMinimo: number;
  estoqueIdeal: number;
}

export const useEstoqueComExpedicao = () => {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { obterSaldoProduto } = useMovimentacoesEstoqueProdutos();
  const { pedidos, carregarPedidos } = useExpedicaoStore();
  
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [saldosCarregados, setSaldosCarregados] = useState(false);
  const [timeoutError, setTimeoutError] = useState(false);
  
  // Refs para controle de estado
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingRef = useRef(false);

  // Filtrar TODOS os pedidos por substatus (mesma lógica do ResumoExpedicao)
  const pedidosSeparados = useMemo(() => 
    pedidos.filter(p => p.substatus_pedido === 'Separado'), 
    [pedidos]
  );
  
  const pedidosDespachados = useMemo(() => 
    pedidos.filter(p => p.substatus_pedido === 'Despachado'), 
    [pedidos]
  );
  
  // Usar o hook para calcular quantidades separadas e despachadas
  const { quantidadesSeparadas, quantidadesDespachadas, calculando } = useQuantidadesExpedicao(
    pedidosSeparados, 
    pedidosDespachados
  );

  // Timeout de segurança global
  useEffect(() => {
    if (loadingSaldos) {
      loadingTimeoutRef.current = setTimeout(() => {
        console.warn('⚠️ Timeout: Carregamento de saldos demorou mais que 15 segundos');
        setTimeoutError(true);
        setLoadingSaldos(false);
        isLoadingRef.current = false;
      }, 15000);
    } else {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }

    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [loadingSaldos]);

  // Memoizar carregarPedidos para evitar dependência circular
  const carregarPedidosMemo = useCallback(carregarPedidos, []);

  // Carregar dados de expedição se não estiverem disponíveis
  useEffect(() => {
    const inicializarDados = async () => {
      if (pedidos.length === 0 && !dadosCarregados) {
        console.log('🔄 Carregando dados de expedição para cálculo de estoque...');
        try {
          await carregarPedidosMemo();
          setDadosCarregados(true);
        } catch (error) {
          console.error('Erro ao carregar dados de expedição:', error);
        }
      }
    };

    inicializarDados();
  }, [pedidos.length, dadosCarregados, carregarPedidosMemo]);

  // Memoizar função de carregar saldos com controle de timeout
  const carregarSaldos = useCallback(async () => {
    if (produtos.length === 0 || isLoadingRef.current) return;

    console.log('🔄 Iniciando carregamento de saldos...');
    isLoadingRef.current = true;
    setLoadingSaldos(true);
    setTimeoutError(false);
    
    const novosSaldos: Record<string, number> = {};

    try {
      // Carregar saldos em paralelo com timeout individual
      const promesasSaldos = produtos.map(async (produto) => {
        try {
          const saldo = await Promise.race([
            obterSaldoProduto(produto.id),
            new Promise<number>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]);
          return { id: produto.id, saldo };
        } catch (error) {
          console.error(`Erro ao obter saldo do produto ${produto.nome}:`, error);
          return { id: produto.id, saldo: 0 };
        }
      });

      const resultados = await Promise.all(promesasSaldos);
      resultados.forEach(({ id, saldo }) => {
        novosSaldos[id] = saldo;
      });

      setSaldos(novosSaldos);
      setSaldosCarregados(true);
      console.log('✅ Saldos carregados com sucesso');
    } catch (error) {
      console.error('❌ Erro ao carregar saldos:', error);
      setTimeoutError(true);
    } finally {
      setLoadingSaldos(false);
      isLoadingRef.current = false;
    }
  }, [produtos, obterSaldoProduto]);

  // Carregar saldos apenas na inicialização usando flag estável
  useEffect(() => {
    if (produtos.length > 0 && !saldosCarregados && !timeoutError) {
      carregarSaldos();
    }
  }, [produtos.length, saldosCarregados, timeoutError, carregarSaldos]);

  // Função para forçar recarregamento em caso de erro
  const forcarRecarregamento = useCallback(() => {
    setSaldosCarregados(false);
    setTimeoutError(false);
    setSaldos({});
    carregarSaldos();
  }, [carregarSaldos]);

  // Transformar dados em formato final
  const produtosComEstoque: ProdutoComEstoqueDetalhado[] = produtos.map(produto => {
    const saldoAtual = saldos[produto.id] || 0;
    const quantidadeSeparada = quantidadesSeparadas[produto.nome] || 0;
    const quantidadeDespachada = quantidadesDespachadas[produto.nome] || 0;
    const saldoReal = saldoAtual - quantidadeSeparada - quantidadeDespachada;

    return {
      id: produto.id,
      nome: produto.nome,
      categoria_id: produto.categoria_id,
      saldoAtual,
      quantidadeSeparada,
      quantidadeDespachada,
      saldoReal,
      ativo: produto.ativo,
      estoqueMinimo: Number(produto.estoque_minimo || 0),
      estoqueIdeal: Number(produto.estoque_ideal || 0)
    };
  });

  const loading = loadingProdutos || loadingSaldos || calculando;

  return {
    produtos: produtosComEstoque,
    loading,
    timeoutError,
    carregarSaldos,
    forcarRecarregamento,
    obterDetalhesCalculo: (nomeProduto: string) => {
      const produto = produtosComEstoque.find(p => p.nome === nomeProduto);
      return produto ? {
        saldoAtual: produto.saldoAtual,
        quantidadeSeparada: produto.quantidadeSeparada,
        quantidadeDespachada: produto.quantidadeDespachada,
        saldoReal: produto.saldoReal
      } : null;
    }
  };
};