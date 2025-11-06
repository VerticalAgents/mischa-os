
import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useSupabaseRepresentantes } from '@/hooks/useSupabaseRepresentantes';
import { useMediaVendasSemanais } from '@/hooks/useMediaVendasSemanais';

export const useOptimizedRepresentantesData = (representanteSelecionado: string, isActive: boolean) => {
  // Only load data when tab is active
  const { clientes, loading: clientesLoading } = useClienteStore();
  const { representantes, loading: representantesLoading } = useSupabaseRepresentantes();
  const { mediaVendasPorProduto, loading: mediaVendasLoading } = useMediaVendasSemanais();

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
    queryKey: ['representantes-data', representanteSelecionado, clientes.length, Object.keys(mediaVendasPorProduto).length],
    queryFn: useCallback(async () => {
      if (!isActive || !clientes.length || mediaVendasLoading) return null;

      // Calcular giro total usando as médias de vendas semanais (mais apurado)
      const giroTotalReal = Object.values(mediaVendasPorProduto).reduce((sum, media) => sum + media, 0);

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
      // Para o gráfico, manter o cálculo por cliente usando médias de vendas
      const dadosGiroBar = categorizedClientes.ativos
        .map(cliente => {
          // Calcular giro do cliente baseado nas categorias habilitadas
          let giroCliente = 0;
          if (cliente.categoriasHabilitadas && Array.isArray(cliente.categoriasHabilitadas)) {
            // Somar as médias dos produtos das categorias habilitadas
            // Por enquanto, usar um valor aproximado baseado no giro médio
            giroCliente = cliente.giroMedioSemanal || 0;
          }
          return {
            nome: cliente.nome.substring(0, 15) + (cliente.nome.length > 15 ? '...' : ''),
            giro: giroCliente,
            clienteId: cliente.id
          };
        })
        .filter(item => item.giro > 0)
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
    }, [isActive, clientes, categorizedClientes, filteredClientes, mediaVendasPorProduto, mediaVendasLoading]),
    enabled: isActive && !clientesLoading && !representantesLoading && !mediaVendasLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
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
    isLoading: isLoading || clientesLoading || representantesLoading || mediaVendasLoading,
    error,
    representantes,
    refetch
  };
};
