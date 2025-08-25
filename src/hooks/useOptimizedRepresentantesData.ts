
import { useMemo } from 'react';
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

  // Use React Query for better caching and loading states
  const { data: optimizedData, isLoading, error } = useQuery({
    queryKey: ['representantes-data', representanteSelecionado, clientes.length, registros.length],
    queryFn: async () => {
      if (!isActive || !clientes.length) return null;

      // Load initial data if needed
      if (clientes.length === 0) {
        await carregarClientes();
      }

      const clientesDoRepresentante = representanteSelecionado === "todos" 
        ? clientes 
        : clientes.filter(cliente => cliente.representanteId?.toString() === representanteSelecionado);

      // Optimize status calculations with memoization
      const clientesAtivos = clientesDoRepresentante.filter(c => c.statusCliente === 'Ativo');
      const clientesEmAnalise = clientesDoRepresentante.filter(c => c.statusCliente === 'Em análise');
      const clientesAtivar = clientesDoRepresentante.filter(c => c.statusCliente === 'A ativar');
      const clientesInativos = clientesDoRepresentante.filter(c => c.statusCliente === 'Inativo');
      const clientesStandby = clientesDoRepresentante.filter(c => c.statusCliente === 'Standby');

      // Optimize giro calculations
      const giroTotalReal = clientesAtivos.reduce((sum, c) => {
        return sum + calcularGiroSemanalHistoricoSync(c.id, registros);
      }, 0);

      const giroMedioPorPDV = clientesAtivos.length > 0 
        ? Math.round(giroTotalReal / clientesAtivos.length)
        : 0;

      const taxaConversao = clientesDoRepresentante.length > 0 
        ? (clientesAtivos.length / clientesDoRepresentante.length) * 100 
        : 0;

      // Optimize chart data generation
      const dadosStatusPie = [
        { name: 'Ativos', value: clientesAtivos.length, color: '#22c55e' },
        { name: 'Em análise', value: clientesEmAnalise.length, color: '#3b82f6' },
        { name: 'A ativar', value: clientesAtivar.length, color: '#f59e0b' },
        { name: 'Standby', value: clientesStandby.length, color: '#6b7280' },
        { name: 'Inativos', value: clientesInativos.length, color: '#ef4444' }
      ].filter(item => item.value > 0);

      const dadosGiroBar = clientesAtivos
        .slice(0, 10)
        .map(cliente => ({
          nome: cliente.nome.substring(0, 15) + (cliente.nome.length > 15 ? '...' : ''),
          giro: calcularGiroSemanalHistoricoSync(cliente.id, registros)
        }))
        .sort((a, b) => b.giro - a.giro);

      return {
        clientesDoRepresentante,
        clientesAtivos,
        clientesEmAnalise,
        clientesAtivar,
        clientesInativos,
        clientesStandby,
        giroTotalReal,
        giroMedioPorPDV,
        taxaConversao,
        dadosStatusPie,
        dadosGiroBar
      };
    },
    enabled: isActive && !clientesLoading && !representantesLoading,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false
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
    representantes
  };
};
