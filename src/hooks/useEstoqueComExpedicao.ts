import { useState, useEffect } from 'react';
import { useSupabaseProdutos } from './useSupabaseProdutos';
import { useMovimentacoesEstoqueProdutos } from './useMovimentacoesEstoqueProdutos';
import { useExpedicaoStore } from './useExpedicaoStore';
import { useQuantidadesExpedicao } from './useQuantidadesExpedicao';

export interface ProdutoComEstoqueDetalhado {
  id: string;
  nome: string;
  saldoAtual: number;
  quantidadeSeparada: number;
  quantidadeDespachada: number;
  saldoReal: number;
  ativo: boolean;
}

export const useEstoqueComExpedicao = () => {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { obterSaldoProduto } = useMovimentacoesEstoqueProdutos();
  const { getPedidosParaSeparacao, getPedidosParaDespacho, carregarPedidos } = useExpedicaoStore();
  
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [loadingSaldos, setLoadingSaldos] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Obter todos os pedidos para calcular quantidades separadas e despachadas
  const todosPedidos = [...getPedidosParaSeparacao(), ...getPedidosParaDespacho()];
  const pedidosSeparados = todosPedidos.filter(p => p.substatus_pedido === 'Separado');
  const pedidosDespachados = todosPedidos.filter(p => p.substatus_pedido === 'Despachado');
  
  // Usar o hook para calcular quantidades separadas e despachadas
  const { quantidadesSeparadas, quantidadesDespachadas, calculando } = useQuantidadesExpedicao(
    pedidosSeparados, 
    pedidosDespachados
  );

  // Carregar dados de expedição se não estiverem disponíveis
  useEffect(() => {
    const inicializarDados = async () => {
      if (todosPedidos.length === 0 && !dadosCarregados) {
        console.log('🔄 Carregando dados de expedição para cálculo de estoque...');
        try {
          await carregarPedidos();
          setDadosCarregados(true);
        } catch (error) {
          console.error('Erro ao carregar dados de expedição:', error);
        }
      }
    };

    inicializarDados();
  }, [todosPedidos.length, dadosCarregados, carregarPedidos]);

  // Carregar saldos dos produtos
  const carregarSaldos = async () => {
    if (produtos.length === 0) return;

    setLoadingSaldos(true);
    const novosSaldos: Record<string, number> = {};

    try {
      // Carregar saldos em paralelo
      const promesasSaldos = produtos.map(async (produto) => {
        try {
          const saldo = await obterSaldoProduto(produto.id);
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
    } catch (error) {
      console.error('Erro ao carregar saldos:', error);
    } finally {
      setLoadingSaldos(false);
    }
  };

  useEffect(() => {
    if (produtos.length > 0) {
      carregarSaldos();
    }
  }, [produtos]);

  // Transformar dados em formato final
  const produtosComEstoque: ProdutoComEstoqueDetalhado[] = produtos.map(produto => {
    const saldoAtual = saldos[produto.id] || 0;
    const quantidadeSeparada = quantidadesSeparadas[produto.nome] || 0;
    const quantidadeDespachada = quantidadesDespachadas[produto.nome] || 0;
    const saldoReal = saldoAtual - quantidadeSeparada - quantidadeDespachada;

    return {
      id: produto.id,
      nome: produto.nome,
      saldoAtual,
      quantidadeSeparada,
      quantidadeDespachada,
      saldoReal,
      ativo: produto.ativo
    };
  });

  const loading = loadingProdutos || loadingSaldos || calculando;

  return {
    produtos: produtosComEstoque,
    loading,
    carregarSaldos,
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