
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

export function useCurvaABC(periodo: string = 'todo') {
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

  // Fetch precos por cliente
  const { data: precos, isLoading: loadingPrecos } = useQuery({
    queryKey: ['curva-abc-precos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('precos_categoria_cliente')
        .select('cliente_id, preco_unitario');
      if (error) throw error;
      return data as PrecoCategoria[];
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
  const { clientesABC, resumoCategorias, dadosGraficos } = useMemo(() => {
    if (!entregas || !clientes) {
      return { clientesABC: [], resumoCategorias: [], dadosGraficos: { pie: [], bar: [] } };
    }

    // Criar mapa de preços por cliente (média se houver múltiplos)
    const precosMap = new Map<string, number>();
    if (precos) {
      const precosPorCliente = new Map<string, number[]>();
      precos.forEach(p => {
        if (!precosPorCliente.has(p.cliente_id)) {
          precosPorCliente.set(p.cliente_id, []);
        }
        precosPorCliente.get(p.cliente_id)!.push(p.preco_unitario);
      });
      precosPorCliente.forEach((valores, clienteId) => {
        const media = valores.reduce((a, b) => a + b, 0) / valores.length;
        precosMap.set(clienteId, media);
      });
    }

    // Criar mapas de representantes e rotas
    const repMap = new Map<number, string>();
    representantes?.forEach(r => repMap.set(r.id, r.nome));
    
    const rotaMap = new Map<number, string>();
    rotas?.forEach(r => rotaMap.set(r.id, r.nome));

    // Criar mapa de clientes
    const clientesMap = new Map<string, Cliente>();
    clientes.forEach(c => clientesMap.set(c.id, c));

    // Agrupar entregas por cliente
    const faturamentoPorCliente = new Map<string, { quantidade: number; faturamento: number }>();
    
    entregas.forEach(entrega => {
      const precoUnitario = precosMap.get(entrega.cliente_id) || 4.50; // Preço padrão
      const faturamento = entrega.quantidade * precoUnitario;
      
      if (!faturamentoPorCliente.has(entrega.cliente_id)) {
        faturamentoPorCliente.set(entrega.cliente_id, { quantidade: 0, faturamento: 0 });
      }
      
      const atual = faturamentoPorCliente.get(entrega.cliente_id)!;
      atual.quantidade += entrega.quantidade;
      atual.faturamento += faturamento;
    });

    // Criar lista de clientes com faturamento
    let listaClientes: ClienteCurvaABC[] = [];
    
    faturamentoPorCliente.forEach((dados, clienteId) => {
      const cliente = clientesMap.get(clienteId);
      if (cliente && dados.quantidade > 0) {
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
    const faturamentoTotal = listaClientes.reduce((sum, c) => sum + c.faturamento_total, 0);

    // Calcular percentual acumulado e classificar
    let acumulado = 0;
    listaClientes.forEach(cliente => {
      cliente.percentual_do_total = faturamentoTotal > 0 
        ? (cliente.faturamento_total / faturamentoTotal) * 100 
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
        percentual_faturamento: faturamentoTotal > 0 ? (faturamentoCat / faturamentoTotal) * 100 : 0,
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
      dadosGraficos: { pie: dadosPie, bar: dadosBar }
    };
  }, [entregas, precos, clientes, representantes, rotas]);

  const isLoading = loadingEntregas || loadingPrecos || loadingClientes;

  return {
    clientesABC,
    resumoCategorias,
    dadosGraficos,
    isLoading,
    faturamentoTotal: clientesABC.reduce((sum, c) => sum + c.faturamento_total, 0)
  };
}
