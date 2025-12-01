import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface ClienteCurvaABC {
  cliente_id: string;
  cliente_nome: string;
  status_cliente: string;
  total_quantidade: number;
  faturamento_total: number;
  percentual_do_total: number;
  percentual_acumulado: number;
  categoria: 'A' | 'B' | 'C';
  representante_nome?: string;
  rota_entrega_nome?: string;
}

export interface ResumoCategoria {
  categoria: 'A' | 'B' | 'C';
  titulo: string;
  num_clientes: number;
  faturamento_total: number;
  percentual_faturamento: number;
  percentual_clientes: number;
}

interface HistoricoEntrega {
  cliente_id: string;
  quantidade: number;
  data: string;
  itens: any;
}

interface PrecoCategoria {
  cliente_id: string;
  categoria_id: number;
  preco_unitario: number;
}

interface Cliente {
  id: string;
  nome: string;
  status_cliente: string | null;
  representante_id: number | null;
  rota_entrega_id: number | null;
}

interface Representante {
  id: number;
  nome: string;
}

interface Rota {
  id: number;
  nome: string;
}

interface ProdutoFinal {
  id: string;
  nome: string;
  categoria_id: number | null;
}

export function useCurvaABC(periodo: string = '90d') {
  // Fetch historico_entregas
  const { data: entregas, isLoading: loadingEntregas } = useQuery({
    queryKey: ['curva-abc-entregas', periodo],
    queryFn: async () => {
      let query = supabase
        .from('historico_entregas')
        .select('cliente_id, quantidade, data, itens')
        .eq('tipo', 'entrega');

      // Filtrar por período
      if (periodo === '30d') {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 30);
        query = query.gte('data', dataLimite.toISOString());
      } else if (periodo === '90d') {
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - 90);
        query = query.gte('data', dataLimite.toISOString());
      } else if (periodo === 'ano') {
        const inicioAno = new Date(new Date().getFullYear(), 0, 1);
        query = query.gte('data', inicioAno.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HistoricoEntrega[];
    }
  });

  // Fetch precos por cliente E categoria
  const { data: precos, isLoading: loadingPrecos } = useQuery({
    queryKey: ['curva-abc-precos-categoria'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('precos_categoria_cliente')
        .select('cliente_id, categoria_id, preco_unitario');
      if (error) throw error;
      return data as PrecoCategoria[];
    }
  });

  // Fetch produtos_finais para obter categoria_id
  const { data: produtos, isLoading: loadingProdutos } = useQuery({
    queryKey: ['curva-abc-produtos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('produtos_finais')
        .select('id, nome, categoria_id');
      if (error) throw error;
      return data as ProdutoFinal[];
    }
  });

  // Fetch configurações de preços padrão
  const { data: configPrecificacao, isLoading: loadingConfig } = useQuery({
    queryKey: ['curva-abc-config-precificacao'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('configuracoes')
        .eq('modulo', 'precificacao')
        .maybeSingle();
      if (error) throw error;
      const config = data?.configuracoes as any;
      return config?.precosPorCategoria || {};
    }
  });

  // Fetch clientes
  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ['curva-abc-clientes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clientes')
        .select('id, nome, status_cliente, representante_id, rota_entrega_id');
      if (error) throw error;
      return data as Cliente[];
    }
  });

  // Fetch representantes
  const { data: representantes } = useQuery({
    queryKey: ['curva-abc-representantes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('representantes')
        .select('id, nome');
      if (error) throw error;
      return data as Representante[];
    }
  });

  // Fetch rotas
  const { data: rotas } = useQuery({
    queryKey: ['curva-abc-rotas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rotas_entrega')
        .select('id, nome');
      if (error) throw error;
      return data as Rota[];
    }
  });

  // Processar dados e calcular Curva ABC
  const { clientesABC, resumoCategorias, dadosGraficos, faturamentoTotal } = useMemo(() => {
    if (!entregas || !clientes || !produtos) {
      return { clientesABC: [], resumoCategorias: [], dadosGraficos: { pie: [], bar: [] }, faturamentoTotal: 0 };
    }

    // Criar mapa de produtos (id -> categoria_id)
    const produtosMap = new Map<string, number>();
    produtos.forEach(p => {
      if (p.categoria_id) {
        produtosMap.set(p.id, p.categoria_id);
      }
    });

    // Criar mapa de preços personalizados (cliente_id -> Map<categoria_id, preco>)
    const precosPersonalizadosMap = new Map<string, Map<number, number>>();
    precos?.forEach(p => {
      if (!precosPersonalizadosMap.has(p.cliente_id)) {
        precosPersonalizadosMap.set(p.cliente_id, new Map());
      }
      precosPersonalizadosMap.get(p.cliente_id)!.set(p.categoria_id, p.preco_unitario);
    });

    // Função para obter preço aplicado
    const obterPreco = (clienteId: string, categoriaId: number): number => {
      // 1. Verificar preço personalizado do cliente para esta categoria
      const precosCliente = precosPersonalizadosMap.get(clienteId);
      if (precosCliente?.has(categoriaId)) {
        const precoPersonalizado = precosCliente.get(categoriaId)!;
        if (precoPersonalizado > 0) {
          return precoPersonalizado;
        }
      }
      
      // 2. Usar preço padrão da categoria (configuracoes_sistema)
      if (configPrecificacao) {
        const precoPadrao = configPrecificacao[categoriaId.toString()];
        if (precoPadrao && Number(precoPadrao) > 0) {
          return Number(precoPadrao);
        }
      }
      
      // 3. Fallback
      return 4.50;
    };

    // Criar mapas de representantes e rotas
    const repMap = new Map<number, string>();
    representantes?.forEach(r => repMap.set(r.id, r.nome));
    
    const rotaMap = new Map<number, string>();
    rotas?.forEach(r => rotaMap.set(r.id, r.nome));

    // Criar mapa de clientes
    const clientesMap = new Map<string, Cliente>();
    clientes.forEach(c => clientesMap.set(c.id, c));

    // Processar entregas e calcular faturamento por cliente (item por item)
    const faturamentoPorCliente = new Map<string, { quantidade: number; faturamento: number }>();
    
    entregas.forEach(entrega => {
      const itens = entrega.itens as any[];
      
      if (!Array.isArray(itens) || itens.length === 0) {
        // Se não tem itens detalhados, não contabiliza (dados antigos sem itens)
        return;
      }
      
      let faturamentoEntrega = 0;
      let quantidadeEntrega = 0;
      
      itens.forEach(item => {
        const produtoId = item.produto_id;
        const quantidade = Number(item.quantidade) || 0;
        
        if (!produtoId || quantidade <= 0) return;
        
        // Obter categoria do produto
        const categoriaId = produtosMap.get(produtoId);
        if (!categoriaId) return;
        
        // Obter preço aplicado (personalizado ou padrão)
        const preco = obterPreco(entrega.cliente_id, categoriaId);
        
        // Calcular faturamento do item
        faturamentoEntrega += quantidade * preco;
        quantidadeEntrega += quantidade;
      });
      
      if (faturamentoEntrega > 0) {
        if (!faturamentoPorCliente.has(entrega.cliente_id)) {
          faturamentoPorCliente.set(entrega.cliente_id, { quantidade: 0, faturamento: 0 });
        }
        
        const atual = faturamentoPorCliente.get(entrega.cliente_id)!;
        atual.quantidade += quantidadeEntrega;
        atual.faturamento += faturamentoEntrega;
      }
    });

    // Criar lista de clientes com faturamento
    let listaClientes: ClienteCurvaABC[] = [];
    
    faturamentoPorCliente.forEach((dados, clienteId) => {
      const cliente = clientesMap.get(clienteId);
      if (cliente && dados.faturamento > 0) {
        listaClientes.push({
          cliente_id: clienteId,
          cliente_nome: cliente.nome,
          status_cliente: cliente.status_cliente || 'Desconhecido',
          total_quantidade: dados.quantidade,
          faturamento_total: dados.faturamento,
          percentual_do_total: 0,
          percentual_acumulado: 0,
          categoria: 'C',
          representante_nome: cliente.representante_id ? repMap.get(cliente.representante_id) : undefined,
          rota_entrega_nome: cliente.rota_entrega_id ? rotaMap.get(cliente.rota_entrega_id) : undefined
        });
      }
    });

    // Ordenar por faturamento (maior para menor)
    listaClientes.sort((a, b) => b.faturamento_total - a.faturamento_total);

    // Calcular faturamento total
    const totalFaturamento = listaClientes.reduce((sum, c) => sum + c.faturamento_total, 0);

    // Calcular percentual acumulado e classificar
    let acumulado = 0;
    listaClientes.forEach(cliente => {
      cliente.percentual_do_total = totalFaturamento > 0 
        ? (cliente.faturamento_total / totalFaturamento) * 100 
        : 0;
      acumulado += cliente.percentual_do_total;
      cliente.percentual_acumulado = acumulado;
      
      if (acumulado <= 80) {
        cliente.categoria = 'A';
      } else if (acumulado <= 95) {
        cliente.categoria = 'B';
      } else {
        cliente.categoria = 'C';
      }
    });

    // Calcular resumo por categoria
    const totalClientesGeral = listaClientes.length;
    
    const categorias: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
    const titulos: Record<'A' | 'B' | 'C', string> = {
      'A': 'Curva A - VIPs',
      'B': 'Curva B - Médios',
      'C': 'Curva C - Cauda Longa'
    };

    const resumo: ResumoCategoria[] = categorias.map(cat => {
      const clientesCat = listaClientes.filter(c => c.categoria === cat);
      const faturamentoCat = clientesCat.reduce((sum, c) => sum + c.faturamento_total, 0);
      
      return {
        categoria: cat,
        titulo: titulos[cat],
        num_clientes: clientesCat.length,
        faturamento_total: faturamentoCat,
        percentual_faturamento: totalFaturamento > 0 ? (faturamentoCat / totalFaturamento) * 100 : 0,
        percentual_clientes: totalClientesGeral > 0 ? (clientesCat.length / totalClientesGeral) * 100 : 0
      };
    });

    // Dados para gráficos
    const dadosPie = resumo.map(r => ({
      categoria: r.categoria,
      nome: r.titulo,
      faturamento: r.faturamento_total,
      percentual: r.percentual_faturamento
    }));

    const dadosBar = resumo.map(r => ({
      categoria: `Curva ${r.categoria}`,
      num_clientes: r.num_clientes,
      percentual_clientes: r.percentual_clientes,
      percentual_faturamento: r.percentual_faturamento
    }));

    return {
      clientesABC: listaClientes,
      resumoCategorias: resumo,
      dadosGraficos: { pie: dadosPie, bar: dadosBar },
      faturamentoTotal: totalFaturamento
    };
  }, [entregas, precos, clientes, representantes, rotas, produtos, configPrecificacao]);

  const isLoading = loadingEntregas || loadingPrecos || loadingClientes || loadingProdutos || loadingConfig;

  return {
    clientesABC,
    resumoCategorias,
    dadosGraficos,
    isLoading,
    faturamentoTotal
  };
}
