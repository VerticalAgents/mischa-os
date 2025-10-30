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

  const buscarProdutos = async (): Promise<Map<string, any>> => {
    console.log('[Indicadores] Iniciando carregamento de produtos...');
    
    try {
      const { data, error } = await supabase
        .from("produtos_finais")
        .select("id, nome, categoria_id, custo_unitario");
      
      if (error) {
        console.error('[Indicadores] ERRO CRÍTICO ao buscar produtos:', error);
        throw new Error(`Falha ao carregar produtos: ${error.message}`);
      }
      
      if (!data || data.length === 0) {
        console.warn('[Indicadores] ATENÇÃO: Nenhum produto encontrado no banco');
        const emptyCache = new Map();
        setProdutosCache(emptyCache);
        return emptyCache;
      }
      
      // Validar produtos sem categoria
      const produtosSemCategoria = data.filter(p => !p.categoria_id);
      if (produtosSemCategoria.length > 0) {
        console.warn(
          `[Indicadores] ${produtosSemCategoria.length} produtos sem categoria:`,
          produtosSemCategoria.map(p => p.nome).join(', ')
        );
      }
      
      const cache = new Map();
      data.forEach(p => cache.set(p.id, p));
      setProdutosCache(cache);
      
      console.log(`[Indicadores] ✅ ${cache.size} produtos carregados (${produtosSemCategoria.length} sem categoria)`);
      
      return cache;
    } catch (error) {
      console.error('[Indicadores] Exceção ao buscar produtos:', error);
      throw error;
    }
  };

  const obterPrecoPadrao = (categoriaId: number): number | null => {
    const configPrecificacao = obterConfiguracao('precificacao');
    
    if (!configPrecificacao?.precosPorCategoria) {
      return null;
    }
    
    const preco = configPrecificacao.precosPorCategoria[categoriaId.toString()];
    
    if (!preco || preco <= 0) {
      return null;
    }
    
    return preco;
  };

  const obterPrecoCliente = async (clienteId: string, categoriaId: number): Promise<number | null> => {
    // 1. Verificar cache primeiro
    if (precosCache.has(clienteId)) {
      const clientePrecos = precosCache.get(clienteId)!;
      if (clientePrecos.has(categoriaId)) {
        return clientePrecos.get(categoriaId)!;
      }
    }

    // 2. Carregar preços do cliente
    const precos = await carregarPrecosPorCliente(clienteId);
    const precoDiferencial = precos.find(p => p.categoria_id === categoriaId);
    
    // 3. Se tem preço diferencial, usar ele
    if (precoDiferencial && Number(precoDiferencial.preco_unitario) > 0) {
      const precoNum = Number(precoDiferencial.preco_unitario);
      if (!precosCache.has(clienteId)) {
        precosCache.set(clienteId, new Map());
      }
      precosCache.get(clienteId)!.set(categoriaId, precoNum);
      return precoNum;
    }
    
    // 4. Senão, usar preço padrão
    const precoPadrao = obterPrecoPadrao(categoriaId);
    if (precoPadrao != null && precoPadrao > 0) {
      const precoNum = Number(precoPadrao);
      if (!precosCache.has(clienteId)) {
        precosCache.set(clienteId, new Map());
      }
      precosCache.get(clienteId)!.set(categoriaId, precoNum);
      return precoNum;
    }
    
    return null;
  };

  const descobrirPrecosUnicos = async (categoriaId: number): Promise<Set<number>> => {
    const precosUnicos = new Set<number>();
    
    // Adicionar preço padrão se existir
    const precoPadrao = obterPrecoPadrao(categoriaId);
    if (precoPadrao && precoPadrao > 0) {
      precosUnicos.add(Number(precoPadrao));
    }
    
    // Adicionar preços diferenciais
    const { data } = await supabase
      .from("precos_categoria_cliente")
      .select("preco_unitario")
      .eq("categoria_id", categoriaId)
      .gt("preco_unitario", 0);
    
    if (data) {
      data.forEach(p => precosUnicos.add(Number(p.preco_unitario)));
    }
    
    return precosUnicos;
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

      // Buscar produtos e usar o Map retornado diretamente
      const produtosMap = await buscarProdutos();
      
      // Validar se o cache foi populado
      if (!produtosMap || produtosMap.size === 0) {
        console.error('[Indicadores] ERRO: Nenhum produto encontrado para análise!');
        throw new Error('Nenhum produto encontrado para análise');
      }
      
      console.log(`[Indicadores] ✅ Cache validado: ${produtosMap.size} produtos disponíveis`);
      
      // Helper local para obter custo usando o Map local
      const obterCustoUnitarioLocal = (produtoId: string, categoriaNome?: string): number => {
        const produto = produtosMap.get(produtoId);
        if (produto?.custo_unitario && Number(produto.custo_unitario) > 0) {
          return Number(produto.custo_unitario);
        }

        if (categoriaNome && CUSTOS_UNITARIOS[categoriaNome]) {
          return CUSTOS_UNITARIOS[categoriaNome];
        }

        return 1.80; // Fallback final
      };

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
        console.log('[Indicadores] Nenhuma entrega encontrada no período');
        setIndicadores({
          periodoAnalise: { dataInicio, dataFim, diasAnalisados: diasRetroativos },
          precoMedioPorCategoria: [],
          custoMedioPorCategoria: [],
          faturamentoMedioPorCategoria: [],
          ticketMedio: { geral: { ticketMedio: 0, totalEntregas: 0, faturamentoTotal: 0 }, porCategoria: [] },
          metadados: { totalEntregasAnalisadas: 0, clientesAtendidos: 0, categoriasComVendas: 0 }
        });
        setLoading(false);
        return;
      }

      console.log(`[Indicadores] ${entregas.length} entregas encontradas para análise`);

      // Estruturas para agregação por categoria
      const categoriaVendas = new Map<number, {
        volumeTotal: number;
        faturamentoTotal: number;
        custoTotal: number;
        clientesUnicos: Set<string>;
        entregasUnicas: Set<string>;
        pools: Map<number, { volumeVendido: number; faturamento: number; percentual: number }>;
      }>();

      let faturamentoTotalGeral = 0;
      const clientesAtendidos = new Set<string>();

      // Processar cada entrega
      for (const entrega of entregas) {
        if (!entrega.id || !entrega.cliente_id) {
          console.warn('[Indicadores] Entrega sem ID ou cliente_id - ignorada');
          continue;
        }

        clientesAtendidos.add(entrega.cliente_id);
        
        if (!Array.isArray(entrega.itens)) {
          console.warn(`[Indicadores] Entrega ${entrega.id} sem itens válidos`);
          continue;
        }

        const itens = entrega.itens;
        let faturamentoEntrega = 0;
        const categoriasDaEntrega = new Set<number>();

        for (const item of itens) {
          const itemTyped = item as any;
          if (!itemTyped.produto_id || !itemTyped.quantidade || itemTyped.quantidade <= 0) continue;

          const produto = produtosMap.get(itemTyped.produto_id);
          if (!produto) {
            console.error(
              `[Indicadores] ❌ ERRO CRÍTICO: Produto ${itemTyped.produto_id} não encontrado.\n` +
              `   Cache local size: ${produtosMap.size}\n` +
              `   IDs no cache: ${Array.from(produtosMap.keys()).slice(0, 3).join(', ')}...`
            );
            continue;
          }

          const categoriaId = produto.categoria_id;
          
          if (!categoriaId) {
            console.warn(`[Indicadores] Produto "${produto.nome}" (${produto.id}) sem categoria - item IGNORADO`);
            continue;
          }

          categoriasDaEntrega.add(categoriaId);

          // Obter preço aplicado ao cliente (padrão ou diferencial)
          const precoAplicado = await obterPrecoCliente(entrega.cliente_id, categoriaId);
          
          if (precoAplicado === null || precoAplicado <= 0) {
            console.warn(
              `[Indicadores] Cliente ${entrega.cliente_id.substring(0,8)}... ` +
              `SEM PREÇO para categoria ${categoriaId} - item "${produto.nome}" IGNORADO`
            );
            continue;
          }

          const categoria = categorias.find(c => c.id === categoriaId);
          const custo = obterCustoUnitarioLocal(itemTyped.produto_id, categoria?.nome);

          const quantidade = itemTyped.quantidade;
          const precoNum = Number(precoAplicado);
          const faturamentoItem = quantidade * precoNum;
          const custoItem = quantidade * custo;

          faturamentoEntrega += faturamentoItem;

          // Inicializar categoria se necessário
          if (!categoriaVendas.has(categoriaId)) {
            categoriaVendas.set(categoriaId, {
              volumeTotal: 0,
              faturamentoTotal: 0,
              custoTotal: 0,
              clientesUnicos: new Set(),
              entregasUnicas: new Set(),
              pools: new Map()
            });
          }

          const stats = categoriaVendas.get(categoriaId)!;
          stats.volumeTotal += quantidade;
          stats.faturamentoTotal += faturamentoItem;
          stats.custoTotal += custoItem;
          stats.clientesUnicos.add(entrega.cliente_id);

          // Acumular no pool de preço correspondente
          if (!stats.pools.has(precoNum)) {
            stats.pools.set(precoNum, {
              volumeVendido: 0,
              faturamento: 0,
              percentual: 0
            });
          }

          const pool = stats.pools.get(precoNum)!;
          pool.volumeVendido += quantidade;
          pool.faturamento += faturamentoItem;
        }

        // Adicionar entrega a todas as categorias que ela contém
        for (const catId of categoriasDaEntrega) {
          const stats = categoriaVendas.get(catId);
          if (stats) {
            stats.entregasUnicas.add(entrega.id);
          }
        }

        faturamentoTotalGeral += faturamentoEntrega;
      }

      // Log de resumo do processamento
      console.log('\n📊 RESUMO DO PROCESSAMENTO:');
      console.log(`   - Entregas processadas: ${entregas.length}`);
      console.log(`   - Categorias com vendas: ${categoriaVendas.size}`);
      console.log(`   - Clientes atendidos: ${clientesAtendidos.size}`);
      
      if (categoriaVendas.size === 0) {
        console.error('⚠️ ATENÇÃO: Nenhuma categoria processada! Verifique logs acima.');
      }

      // Calcular indicadores por categoria
      const precoMedioPorCategoria: PrecoMedioCategoria[] = [];
      const custoMedioPorCategoria: CustoMedioCategoria[] = [];
      const faturamentoMedioPorCategoria: FaturamentoMedioCategoria[] = [];
      const ticketMedioPorCategoria: TicketMedio['porCategoria'] = [];

      console.log('\n📊 RESULTADO - Preço Médio por Categoria (Pools Numéricos):');
      
      for (const [categoriaId, stats] of categoriaVendas.entries()) {
        const categoria = categorias.find(c => c.id === categoriaId);
        if (!categoria) continue;

        // Calcular percentuais dos pools
        stats.pools.forEach(pool => {
          pool.percentual = stats.volumeTotal > 0 ? (pool.volumeVendido / stats.volumeTotal) * 100 : 0;
        });

        // Calcular preço médio ponderado
        let precoMedio = 0;
        stats.pools.forEach((pool, preco) => {
          precoMedio += (preco * pool.percentual / 100);
        });

        const custoMedio = stats.volumeTotal > 0 ? stats.custoTotal / stats.volumeTotal : 0;

        console.log(`\n✅ ${categoria.nome}:`);
        console.log(`   - Volume Total: ${stats.volumeTotal} unidades`);
        console.log(`   - Faturamento Total: R$ ${stats.faturamentoTotal.toFixed(2)}`);
        console.log(`   - ${stats.pools.size} preços únicos encontrados:`);
        
        // Ordenar pools por preço decrescente para melhor visualização
        const poolsOrdenados = Array.from(stats.pools.entries()).sort((a, b) => b[0] - a[0]);
        
        poolsOrdenados.forEach(([preco, pool]) => {
          const contribuicao = (preco * pool.percentual / 100);
          console.log(
            `      • R$ ${preco.toFixed(2)}: ${pool.volumeVendido} un (${pool.percentual.toFixed(1)}%) ` +
            `→ contribui R$ ${contribuicao.toFixed(2)}`
          );
        });
        
        console.log(`   ✅ PREÇO MÉDIO PONDERADO: R$ ${precoMedio.toFixed(2)}/un`);
        console.log(`   - Custo Médio: R$ ${custoMedio.toFixed(2)}/un`);
        console.log(`   - Clientes: ${stats.clientesUnicos.size}`);
        console.log(`   - Entregas: ${stats.entregasUnicas.size}`);

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
          ticketMedio: stats.entregasUnicas.size > 0 ? stats.faturamentoTotal / stats.entregasUnicas.size : 0,
          numeroEntregas: stats.entregasUnicas.size,
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
    if (categorias.length > 0) {
      calcularIndicadores();
    } else {
      console.warn('[Indicadores] Aguardando carregamento de categorias...');
    }
  }, [diasRetroativos, categorias.length]);

  return { 
    indicadores, 
    loading, 
    error, 
    recalcular: calcularIndicadores 
  };
};
