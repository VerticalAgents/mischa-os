
import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseRepresentantes } from '@/hooks/useSupabaseRepresentantes';
import { useHistoricoEntregasStore } from '@/hooks/useHistoricoEntregasStore';
import { calcularGiroSemanalHistoricoSync } from '@/utils/giroCalculations';

export const useOptimizedRepresentantesData = (representanteSelecionado: string, isActive: boolean) => {
  // Only load data when tab is active
  const { clientes, loading: clientesLoading, carregarClientes } = useClienteStore();
  const { representantes, loading: representantesLoading } = useSupabaseRepresentantes();
  const { registros } = useHistoricoEntregasStore();

  // Memoized calculations for better performance
  const filteredClientes = useMemo(() => {
    return representanteSelecionado === "todos" 
      ? clientes 
      : clientes.filter(cliente => cliente.representanteId?.toString() === representanteSelecionado);
  }, [clientes, representanteSelecionado]);

  const categorizedClientes = useMemo(() => {
    return {
      ativos: filteredClientes.filter(c => c.statusCliente === 'Ativo'),
      emAnalise: filteredClientes.filter(c => c.statusCliente === 'Em análise'),
      ativar: filteredClientes.filter(c => c.statusCliente === 'A ativar'),
      inativos: filteredClientes.filter(c => c.statusCliente === 'Inativo'),
      standby: filteredClientes.filter(c => c.statusCliente === 'Standby')
    };
  }, [filteredClientes]);

  // Use React Query for better caching and loading states
  const { data: optimizedData, isLoading, error, refetch } = useQuery({
    queryKey: ['representantes-data', representanteSelecionado, clientes.length, registros.length],
    queryFn: useCallback(async () => {
      if (!isActive || !clientes.length) return null;

      // Optimized giro calculations with early return
      const giroTotalReal = categorizedClientes.ativos.reduce((sum, c) => {
        return sum + calcularGiroSemanalHistoricoSync(c.id, registros);
      }, 0);

      const giroMedioPorPDV = categorizedClientes.ativos.length > 0 
        ? Math.round(giroTotalReal / categorizedClientes.ativos.length)
        : 0;

      const taxaConversao = filteredClientes.length > 0 
        ? (categorizedClientes.ativos.length / filteredClientes.length) * 100 
        : 0;

      // Optimize chart data generation with semantic colors
      const dadosStatusPie = [
        { name: 'Ativos', value: categorizedClientes.ativos.length, color: 'hsl(var(--chart-1))' },
        { name: 'Em análise', value: categorizedClientes.emAnalise.length, color: 'hsl(var(--chart-2))' },
        { name: 'A ativar', value: categorizedClientes.ativar.length, color: 'hsl(var(--chart-3))' },
        { name: 'Standby', value: categorizedClientes.standby.length, color: 'hsl(var(--chart-4))' },
        { name: 'Inativos', value: categorizedClientes.inativos.length, color: 'hsl(var(--chart-5))' }
      ].filter(item => item.value > 0);

      // Improved bar chart with better performance
      const dadosGiroBar = categorizedClientes.ativos
        .map(cliente => ({
          nome: cliente.nome.substring(0, 15) + (cliente.nome.length > 15 ? '...' : ''),
          giro: calcularGiroSemanalHistoricoSync(cliente.id, registros),
          clienteId: cliente.id
        }))
        .sort((a, b) => b.giro - a.giro)
        .slice(0, 10);

      return {
        clientesDoRepresentante: filteredClientes,
        clientesAtivos: categorizedClientes.ativos,
        clientesEmAnalise: categorizedClientes.emAnalise,
        clientesAtivar: categorizedClientes.ativar,
        clientesInativos: categorizedClientes.inativos,
        clientesStandby: categorizedClientes.standby,
        giroTotalReal,
        giroMedioPorPDV,
        taxaConversao,
        dadosStatusPie,
        dadosGiroBar
      };
    }, [isActive, clientes, categorizedClientes, filteredClientes, registros]),
    enabled: isActive && !clientesLoading && !representantesLoading,
    staleTime: 3 * 60 * 1000, // 3 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const representanteNome = useMemo(() => {
    if (representanteSelecionado === "todos") return "Todos os Representantes";
    const rep = representantes.find(r => r.id.toString() === representanteSelecionado);
    return rep ? rep.nome : "Representante não encontrado";
  }, [representanteSelecionado, representantes]);

  return {
    data: optimizedData || {
      clientesDoRepresentante: [],
      clientesAtivos: [],
      clientesEmAnalise: [],
      clientesAtivar: [],
      clientesInativos: [],
      clientesStandby: [],
      giroTotalReal: 0,
      giroMedioPorPDV: 0,
      taxaConversao: 0,
      dadosStatusPie: [],
      dadosGiroBar: []
    },
    representanteNome,
    isLoading: isLoading || clientesLoading || representantesLoading,
    error,
    representantes,
    refetch
  };
};
