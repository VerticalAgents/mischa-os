import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useClienteStore } from './useClienteStore';
import { useSupabaseCategoriasProduto } from './useSupabaseCategoriasProduto';
import { useSupabasePrecosCategoriaCliente } from './useSupabasePrecosCategoriaCliente';
import { useSupabaseGirosSemanaPersonalizados } from './useSupabaseGirosSemanaPersonalizados';
import { useConfiguracoesStore } from './useConfiguracoesStore';
import { useFinancialCache } from './useFinancialCache';
import { useGiroHistoricoReal } from './useGiroHistoricoReal';

// Preços temporários por categoria (fallback)
const PRECOS_TEMPORARIOS: Record<string, number> = {
  'revenda padrão': 4.50,
  'food service': 70.00,
  'default': 5.00
};

interface DetailedPrice {
  clienteId: string;
  clienteNome: string;
  categoriaId: number;
  categoriaNome: string;
  precoUnitario: number;
  precoPersonalizado: boolean;
  giroSemanal: number;
  faturamentoSemanal: number;
  origemGiro?: 'personalizado' | 'historico_completo' | 'historico_parcial' | 'projetado';
  numeroSemanasHistorico?: number;
}

export function useOptimizedFinancialProjection(): {
  faturamentoSemanal: number;
  faturamentoMensal: number;
  precosDetalhados: DetailedPrice[];
  isLoading: boolean;
  error: any;
  disponivel: boolean;
  recalcular: () => void;
  lastUpdated?: Date;
} {
  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { carregarTodosPrecos } = useSupabasePrecosCategoriaCliente();
  const { carregarTodosGiros } = useSupabaseGirosSemanaPersonalizados();
  const { obterConfiguracao } = useConfiguracoesStore();
  const { setCachedData, getCachedData } = useFinancialCache();
  
  const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo');
  const { data: girosHistoricos } = useGiroHistoricoReal(clientesAtivos.map(c => c.id));

  // Função memoizada para obter preço por categoria
  const obterPrecoCategoria = useCallback((nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, preco] of Object.entries(PRECOS_TEMPORARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return preco;
      }
    }
    return PRECOS_TEMPORARIOS.default;
  }, []);

  // Query otimizada que carrega todos os dados em paralelo
  const {
    data: projectionData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['financial-projection', clientes.length, categorias.length],
    queryFn: async () => {
      console.log('🚀 Carregando projeção financeira otimizada...');
      
      // Verificar cache primeiro (v2 com giro histórico)
      const cachedData = getCachedData();
      if (cachedData && Date.now() - cachedData.lastUpdated.getTime() < 5 * 60 * 1000) {
        console.log('📦 Dados carregados do cache (v2)');
        return cachedData;
      }

      const startTime = performance.now();
      const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');

      // Carregar TODOS os dados em paralelo (elimina N+1)
      const [
        todosPrecos,
        todosGiros
      ] = await Promise.all([
        carregarTodosPrecos(),
        carregarTodosGiros()
      ]);

      console.log('⚡ Dados carregados em paralelo:', {
        precos: todosPrecos.length,
        giros: todosGiros.length,
        tempo: `${performance.now() - startTime}ms`
      });

      if (clientesAtivos.length === 0 || categorias.length === 0) {
        return {
          faturamentoSemanal: 0,
          faturamentoMensal: 0,
          precosDetalhados: [],
          lastUpdated: new Date()
        };
      }

      // Criar maps para busca O(1)
      const precosMap = new Map<string, number>();
      const girosMap = new Map<string, number>();
      
      todosPrecos.forEach(preco => {
        const key = `${preco.cliente_id}_${preco.categoria_id}`;
        precosMap.set(key, preco.preco_unitario);
      });
      
      todosGiros.forEach(giro => {
        const key = `${giro.cliente_id}_${giro.categoria_id}`;
        girosMap.set(key, giro.giro_semanal);
      });

      // Obter configuração de preços padrão uma única vez
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};

      let totalFaturamentoSemanal = 0;
      const detalhes: DetailedPrice[] = [];

      // Processar cada cliente de forma otimizada
      for (const cliente of clientesAtivos) {
        if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
          continue;
        }

        // Processar cada categoria habilitada
        for (const categoriaId of cliente.categoriasHabilitadas) {
          const categoria = categorias.find(cat => cat.id === categoriaId);
          if (!categoria) continue;

          const key = `${cliente.id}_${categoriaId}`;

          // Calcular giro semanal com prioridades: personalizado > histórico > projetado
          let giroSemanal = 0;
          let origemGiro: 'personalizado' | 'historico_completo' | 'historico_parcial' | 'projetado' = 'projetado';
          
          // Prioridade 1: giro personalizado para a categoria
          const giroPersonalizado = girosMap.get(key);
          if (giroPersonalizado !== undefined) {
            giroSemanal = Math.round(giroPersonalizado);
            origemGiro = 'personalizado';
          } else {
            // Prioridade 2: giro histórico real (últimas 12 semanas ou desde primeira entrega)
            const giroHistorico = girosHistoricos?.get(cliente.id);
            if (giroHistorico && giroHistorico.giroSemanal > 0) {
              giroSemanal = giroHistorico.giroSemanal;
              origemGiro = giroHistorico.origem as any;
            } else if (cliente.periodicidadePadrao > 0) {
              // Fallback: cálculo projetado
              giroSemanal = Math.round((cliente.quantidadePadrao / cliente.periodicidadePadrao) * 7);
              origemGiro = 'projetado';
            }
          }

          // Obter preço aplicado (busca O(1))
          const precoPersonalizado = precosMap.get(key);
          let precoAplicado = 0;
          let isPersonalizado = false;

          if (precoPersonalizado !== undefined && precoPersonalizado > 0) {
            precoAplicado = precoPersonalizado;
            isPersonalizado = true;
          } else {
            const precoPadrao = precosPadrao[categoriaId.toString()];
            precoAplicado = precoPadrao && precoPadrao > 0 
              ? precoPadrao 
              : obterPrecoCategoria(categoria.nome);
          }

          const faturamentoSemanal = giroSemanal * precoAplicado;
          totalFaturamentoSemanal += faturamentoSemanal;

          detalhes.push({
            clienteId: cliente.id,
            clienteNome: cliente.nome,
            categoriaId,
            categoriaNome: categoria.nome,
            precoUnitario: precoAplicado,
            precoPersonalizado: isPersonalizado,
            giroSemanal,
            faturamentoSemanal,
            origemGiro,
            numeroSemanasHistorico: girosHistoricos?.get(cliente.id)?.numeroSemanas || 0,
          });
        }
      }

      const resultado = {
        faturamentoSemanal: totalFaturamentoSemanal,
        faturamentoMensal: totalFaturamentoSemanal * 4,
        precosDetalhados: detalhes,
        lastUpdated: new Date()
      };

      // Salvar no cache
      setCachedData(resultado);

      console.log('✅ Projeção financeira calculada em:', `${performance.now() - startTime}ms`);
      
      return resultado;
    },
    enabled: clientes.length > 0 && categorias.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  // Função para invalidar cache e recarregar
  const recalculate = useCallback(() => {
    console.log('🔄 Forçando recálculo da projeção...');
    refetch();
  }, [refetch]);

  return {
    faturamentoSemanal: projectionData?.faturamentoSemanal || 0,
    faturamentoMensal: projectionData?.faturamentoMensal || 0,
    precosDetalhados: projectionData?.precosDetalhados || [],
    isLoading,
    error,
    disponivel: (projectionData?.faturamentoSemanal || 0) > 0,
    recalcular: recalculate,
    lastUpdated: projectionData?.lastUpdated
  };
}