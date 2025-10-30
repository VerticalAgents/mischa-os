import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClienteStore } from "./useClienteStore";
import { useSupabaseCategoriasProduto } from "./useSupabaseCategoriasProduto";
import { useSupabasePrecosCategoriaCliente } from "./useSupabasePrecosCategoriaCliente";
import { useConfiguracoesStore } from "./useConfiguracoesStore";

interface PrecoMedioCategoria {
  categoriaId: number;
  categoriaNome: string;
  precoMedio: number;
  volumeTotal: number;
  faturamentoTotal: number;
  numeroClientes: number;
}

interface CustoMedioCategoria {
  categoriaId: number;
  categoriaNome: string;
  custoMedio: number;
  volumeTotal: number;
  custoTotal: number;
}

interface FaturamentoMedioCategoria {
  categoriaId: number;
  categoriaNome: string;
  faturamentoTotal: number;
  numeroClientesAtivos: number;
  faturamentoMedioPorCliente: number;
}

interface TicketMedio {
  geral: {
    ticketMedio: number;
    totalEntregas: number;
    faturamentoTotal: number;
  };
  porCategoria: {
    categoriaId: number;
    categoriaNome: string;
    ticketMedio: number;
    numeroEntregas: number;
    faturamento: number;
  }[];
}

export interface IndicadoresFinanceiros {
  periodoAnalise: {
    dataInicio: Date;
    dataFim: Date;
    diasAnalisados: number;
  };
  precoMedioPorCategoria: PrecoMedioCategoria[];
  custoMedioPorCategoria: CustoMedioCategoria[];
  faturamentoMedioPorCategoria: FaturamentoMedioCategoria[];
  ticketMedio: TicketMedio;
  metadados: {
    totalEntregasAnalisadas: number;
    clientesAtendidos: number;
    categoriasComVendas: number;
  };
}

const PRECOS_TEMPORARIOS: Record<string, number> = {
  "Tradicional": 3.50,
  "Gourmet": 5.00,
  "Premium": 6.50,
};

const CUSTOS_UNITARIOS: Record<string, number> = {
  "Tradicional": 1.80,
  "Gourmet": 2.50,
  "Premium": 3.20,
};

export const useIndicadoresFinanceiros = (diasRetroativos: number = 30) => {
  const [indicadores, setIndicadores] = useState<IndicadoresFinanceiros | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const { obterConfiguracao } = useConfiguracoesStore();

  // Cache de produtos
  const [produtosCache, setProdutosCache] = useState<Map<string, any>>(new Map());
  const [precosCache, setPrecosCache] = useState<Map<string, Map<number, number>>>(new Map());

  const buscarProdutos = async () => {
    const { data } = await supabase
      .from("produtos_finais")
      .select("id, nome, categoria_id, custo_unitario");
    
    if (data) {
      const cache = new Map();
      data.forEach(p => cache.set(p.id, p));
      setProdutosCache(cache);
    }
  };

  const obterPrecoAplicado = async (clienteId: string, categoriaId: number): Promise<number> => {
    // Verificar cache
    if (precosCache.has(clienteId)) {
      const clientePrecos = precosCache.get(clienteId)!;
      if (clientePrecos.has(categoriaId)) {
        return clientePrecos.get(categoriaId)!;
      }
    }

    // Buscar do banco
    const precos = await carregarPrecosPorCliente(clienteId);
    const precoPersonalizado = precos.find(p => p.categoria_id === categoriaId);
    
    if (precoPersonalizado && precoPersonalizado.preco_unitario > 0) {
      // Atualizar cache
      if (!precosCache.has(clienteId)) {
        precosCache.set(clienteId, new Map());
      }
      precosCache.get(clienteId)!.set(categoriaId, precoPersonalizado.preco_unitario);
      return precoPersonalizado.preco_unitario;
    }

    // Fallback para configuração geral
    const config = obterConfiguracao('precificacao');
    if (config?.precosPorCategoria?.[categoriaId]) {
      return config.precosPorCategoria[categoriaId];
    }

    // Fallback para categoria nome
    const categoria = categorias.find(c => c.id === categoriaId);
    if (categoria && PRECOS_TEMPORARIOS[categoria.nome]) {
      return PRECOS_TEMPORARIOS[categoria.nome];
    }

    return 3.50; // Fallback final
  };

  const obterCustoUnitario = (produtoId: string, categoriaNome?: string): number => {
    const produto = produtosCache.get(produtoId);
    if (produto?.custo_unitario && produto.custo_unitario > 0) {
      return produto.custo_unitario;
    }

    if (categoriaNome && CUSTOS_UNITARIOS[categoriaNome]) {
      return CUSTOS_UNITARIOS[categoriaNome];
    }

    return 1.80; // Fallback final
  };

  const calcularIndicadores = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar produtos para cache
      await buscarProdutos();

      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasRetroativos);

      // Buscar entregas dos últimos N dias
      const { data: entregas, error: entregasError } = await supabase
        .from("historico_entregas")
        .select("*")
        .eq("tipo", "entrega")
        .gte("data", dataInicio.toISOString())
        .lte("data", dataFim.toISOString());

      if (entregasError) throw entregasError;
      if (!entregas || entregas.length === 0) {
        setIndicadores({
          periodoAnalise: { dataInicio, dataFim, diasAnalisados: diasRetroativos },
          precoMedioPorCategoria: [],
          custoMedioPorCategoria: [],
          faturamentoMedioPorCategoria: [],
          ticketMedio: { geral: { ticketMedio: 0, totalEntregas: 0, faturamentoTotal: 0 }, porCategoria: [] },
          metadados: { totalEntregasAnalisadas: 0, clientesAtendidos: 0, categoriasComVendas: 0 }
        });
        return;
      }

      // Estruturas para agregação
      const categoriaVendas = new Map<number, {
        volumeTotal: number;
        faturamentoTotal: number;
        custoTotal: number;
        clientesUnicos: Set<string>;
        entregasComCategoria: number;
      }>();

      let faturamentoTotalGeral = 0;
      const clientesAtendidos = new Set<string>();

      // Processar cada entrega
      for (const entrega of entregas) {
        clientesAtendidos.add(entrega.cliente_id);
        
        const itens = Array.isArray(entrega.itens) ? entrega.itens : [];
        let faturamentoEntrega = 0;

        for (const item of itens) {
          const itemTyped = item as any;
          if (!itemTyped.produto_id || !itemTyped.quantidade || itemTyped.quantidade <= 0) continue;

          // Obter categoria do produto
          const produto = produtosCache.get(itemTyped.produto_id);
          const categoriaId = itemTyped.categoria_id || produto?.categoria_id;
          
          if (!categoriaId) continue;

          // Obter preço e custo
          const preco = await obterPrecoAplicado(entrega.cliente_id, categoriaId);
          const categoria = categorias.find(c => c.id === categoriaId);
          const custo = obterCustoUnitario(itemTyped.produto_id, categoria?.nome);

          const quantidade = itemTyped.quantidade;
          const faturamentoItem = quantidade * preco;
          const custoItem = quantidade * custo;

          faturamentoEntrega += faturamentoItem;

          // Agregar por categoria
          if (!categoriaVendas.has(categoriaId)) {
            categoriaVendas.set(categoriaId, {
              volumeTotal: 0,
              faturamentoTotal: 0,
              custoTotal: 0,
              clientesUnicos: new Set(),
              entregasComCategoria: 0
            });
          }

          const stats = categoriaVendas.get(categoriaId)!;
          stats.volumeTotal += quantidade;
          stats.faturamentoTotal += faturamentoItem;
          stats.custoTotal += custoItem;
          stats.clientesUnicos.add(entrega.cliente_id);
        }

        faturamentoTotalGeral += faturamentoEntrega;
      }

      // Calcular indicadores por categoria
      const precoMedioPorCategoria: PrecoMedioCategoria[] = [];
      const custoMedioPorCategoria: CustoMedioCategoria[] = [];
      const faturamentoMedioPorCategoria: FaturamentoMedioCategoria[] = [];
      const ticketMedioPorCategoria: TicketMedio['porCategoria'] = [];

      for (const [categoriaId, stats] of categoriaVendas.entries()) {
        const categoria = categorias.find(c => c.id === categoriaId);
        if (!categoria) continue;

        const precoMedio = stats.volumeTotal > 0 ? stats.faturamentoTotal / stats.volumeTotal : 0;
        const custoMedio = stats.volumeTotal > 0 ? stats.custoTotal / stats.volumeTotal : 0;

        precoMedioPorCategoria.push({
          categoriaId,
          categoriaNome: categoria.nome,
          precoMedio,
          volumeTotal: stats.volumeTotal,
          faturamentoTotal: stats.faturamentoTotal,
          numeroClientes: stats.clientesUnicos.size
        });

        custoMedioPorCategoria.push({
          categoriaId,
          categoriaNome: categoria.nome,
          custoMedio,
          volumeTotal: stats.volumeTotal,
          custoTotal: stats.custoTotal
        });

        // Contar clientes ativos com esta categoria habilitada
        const clientesAtivosCategoria = clientes.filter(c => 
          c.statusCliente === 'Ativo' && 
          Array.isArray(c.categoriasHabilitadas) &&
          c.categoriasHabilitadas.includes(categoriaId)
        ).length;

        const faturamentoMedioPorCliente = clientesAtivosCategoria > 0 
          ? stats.faturamentoTotal / clientesAtivosCategoria 
          : 0;

        faturamentoMedioPorCategoria.push({
          categoriaId,
          categoriaNome: categoria.nome,
          faturamentoTotal: stats.faturamentoTotal,
          numeroClientesAtivos: clientesAtivosCategoria,
          faturamentoMedioPorCliente
        });

        ticketMedioPorCategoria.push({
          categoriaId,
          categoriaNome: categoria.nome,
          ticketMedio: stats.entregasComCategoria > 0 ? stats.faturamentoTotal / stats.entregasComCategoria : 0,
          numeroEntregas: stats.entregasComCategoria,
          faturamento: stats.faturamentoTotal
        });
      }

      const ticketMedioGeral = entregas.length > 0 ? faturamentoTotalGeral / entregas.length : 0;

      setIndicadores({
        periodoAnalise: {
          dataInicio,
          dataFim,
          diasAnalisados: diasRetroativos
        },
        precoMedioPorCategoria: precoMedioPorCategoria.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal),
        custoMedioPorCategoria: custoMedioPorCategoria.sort((a, b) => b.custoTotal - a.custoTotal),
        faturamentoMedioPorCategoria: faturamentoMedioPorCategoria.sort((a, b) => b.faturamentoTotal - a.faturamentoTotal),
        ticketMedio: {
          geral: {
            ticketMedio: ticketMedioGeral,
            totalEntregas: entregas.length,
            faturamentoTotal: faturamentoTotalGeral
          },
          porCategoria: ticketMedioPorCategoria.sort((a, b) => b.faturamento - a.faturamento)
        },
        metadados: {
          totalEntregasAnalisadas: entregas.length,
          clientesAtendidos: clientesAtendidos.size,
          categoriasComVendas: categoriaVendas.size
        }
      });

    } catch (err) {
      console.error("Erro ao calcular indicadores:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categorias.length > 0 && clientes.length > 0) {
      calcularIndicadores();
    }
  }, [diasRetroativos, categorias.length, clientes.length]);

  return { 
    indicadores, 
    loading, 
    error, 
    recalcular: calcularIndicadores 
  };
};
