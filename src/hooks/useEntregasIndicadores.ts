
import { useState, useEffect } from 'react';
import { useHistoricoEntregasStore } from './useHistoricoEntregasStore';
import { useSupabasePrecosCategoriaCliente } from './useSupabasePrecosCategoriaCliente';
import { useClienteStore } from './useClienteStore';

interface IndicadoresEntregas {
  totalEntregas: number;
  faturamentoTotal: number;
  clientesAtendidos: number;
  ticketMedio: number;
}

// Cache global para preços
const precosCache = new Map<string, { precos: { [key: string]: number }, timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const useEntregasIndicadores = (dataInicio: string, dataFim: string) => {
  const [indicadores, setIndicadores] = useState<IndicadoresEntregas>({
    totalEntregas: 0,
    faturamentoTotal: 0,
    clientesAtendidos: 0,
    ticketMedio: 0
  });
  const [loading, setLoading] = useState(false);

  const { carregarHistorico, registros } = useHistoricoEntregasStore();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const { clientes } = useClienteStore();

  // Função para buscar preços com cache
  const obterPrecosPorCliente = async (clienteId: string) => {
    const cached = precosCache.get(clienteId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      return cached.precos;
    }

    try {
      const precos = await carregarPrecosPorCliente(clienteId);
      const precosMap: { [key: string]: number } = {};
      
      precos.forEach(preco => {
        precosMap[preco.categoria_id.toString()] = preco.preco_unitario;
      });
      
      precosCache.set(clienteId, {
        precos: precosMap,
        timestamp: Date.now()
      });
      
      return precosMap;
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
      return {};
    }
  };

  // Função para calcular faturamento de uma entrega
  const calcularFaturamentoEntrega = async (entrega: any) => {
    if (entrega.tipo === 'retorno') return 0;
    
    try {
      const precos = await obterPrecosPorCliente(entrega.cliente_id);
      let faturamento = 0;

      if (entrega.itens && entrega.itens.length > 0) {
        entrega.itens.forEach((item: any) => {
          const precoItem = precos[item.categoria_id?.toString()];
          if (precoItem && item.quantidade) {
            faturamento += item.quantidade * precoItem;
          }
        });
      } else {
        const cliente = clientes.find(c => c.id === entrega.cliente_id);
        if (cliente?.categoriasHabilitadas && Array.isArray(cliente.categoriasHabilitadas)) {
          const totalCategorias = cliente.categoriasHabilitadas.length;
          const quantidadePorCategoria = entrega.quantidade / totalCategorias;
          
          cliente.categoriasHabilitadas.forEach((categoria: any) => {
            const precoCategoria = precos[categoria.id?.toString()];
            if (precoCategoria) {
              faturamento += quantidadePorCategoria * precoCategoria;
            }
          });
        }
      }

      return faturamento;
    } catch (error) {
      console.error('Erro ao calcular faturamento:', error);
      return 0;
    }
  };

  // Calcular indicadores
  const calcularIndicadores = async () => {
    if (!registros || registros.length === 0) return;

    setLoading(true);
    try {
      const dataInicioDate = new Date(dataInicio);
      const dataFimDate = new Date(dataFim);
      
      const entregasPeriodo = registros.filter(h => {
        const dataEntrega = new Date(h.data);
        return dataEntrega >= dataInicioDate && dataEntrega <= dataFimDate;
      });

      const entregas = entregasPeriodo.filter(e => e.tipo === 'entrega');
      
      // Calcular faturamento em paralelo
      const faturamentoPromises = entregas.map(entrega => calcularFaturamentoEntrega(entrega));
      const faturamentos = await Promise.all(faturamentoPromises);
      
      const faturamentoTotal = faturamentos.reduce((sum, valor) => sum + valor, 0);
      const clientesUnicos = new Set(entregas.map(e => e.cliente_id));
      const ticketMedio = entregas.length > 0 ? faturamentoTotal / entregas.length : 0;

      setIndicadores({
        totalEntregas: entregas.length,
        faturamentoTotal,
        clientesAtendidos: clientesUnicos.size,
        ticketMedio
      });
    } catch (error) {
      console.error('Erro ao calcular indicadores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados quando período ou registros mudam
  useEffect(() => {
    const carregarDados = async () => {
      await carregarHistorico();
      await calcularIndicadores();
    };
    
    carregarDados();
  }, [dataInicio, dataFim]);

  useEffect(() => {
    calcularIndicadores();
  }, [registros]);

  return {
    indicadores,
    loading,
    recalcular: calcularIndicadores
  };
};
