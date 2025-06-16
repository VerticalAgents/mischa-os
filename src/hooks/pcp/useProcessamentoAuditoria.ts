
import { useState, useRef, useCallback, useMemo } from 'react';
import { useAgendamentoClienteStore } from '../useAgendamentoClienteStore';
import { useProporoesPadrao } from '../useProporoesPadrao';
import { useProdutosAtivos } from './useProdutosAtivos';
import { processarAgendamentosBatch, filtrarAgendamentos } from './utils/dataProcessing';
import { AuditoriaItem } from './types';

export const useProcessamentoAuditoria = () => {
  const [dadosAuditoria, setDadosAuditoria] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const processandoRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<string, AuditoriaItem[]>>(new Map());

  const { agendamentos, agendamentosCompletos } = useAgendamentoClienteStore();
  const { produtosAtivosComCategoria } = useProdutosAtivos();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

  // Gerar chave de cache baseada nos filtros
  const gerarChaveCache = useCallback((
    dataInicio?: string,
    dataFim?: string, 
    filtroCliente?: string, 
    filtroStatus?: string
  ) => {
    return `${dataInicio || ''}-${dataFim || ''}-${filtroCliente || ''}-${filtroStatus || 'todos'}`;
  }, []);

  // Função otimizada com cache e debounce
  const processarDadosAuditoria = useCallback(async (
    dataInicio?: string, 
    dataFim?: string, 
    filtroCliente?: string, 
    filtroStatus?: string
  ) => {
    // Gerar chave de cache
    const chaveCache = gerarChaveCache(dataInicio, dataFim, filtroCliente, filtroStatus);
    
    // Verificar cache primeiro
    const dadosCache = cacheRef.current.get(chaveCache);
    if (dadosCache) {
      console.log('📦 Usando dados do cache para:', chaveCache);
      setDadosAuditoria(dadosCache);
      return;
    }

    // Cancelar processamento anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Evitar múltiplas execuções simultâneas
    if (processandoRef.current) {
      console.log('⏳ Processamento já em andamento, ignorando nova requisição');
      return;
    }

    // Se não há agendamentos, retornar array vazio
    if (!agendamentos || agendamentos.length === 0) {
      console.log('📋 Nenhum agendamento disponível');
      setDadosAuditoria([]);
      return;
    }

    // Debounce de 300ms
    timeoutRef.current = setTimeout(async () => {
      processandoRef.current = true;
      setLoading(true);
      
      try {
        console.log('🔍 Processando dados de auditoria...');
        console.log('📊 Total de agendamentos:', agendamentos.length);
        console.log('🏭 Produtos ativos:', produtosAtivosComCategoria.length);

        // Filtrar agendamentos
        const agendamentosFiltrados = filtrarAgendamentos(
          agendamentos,
          dataInicio,
          dataFim,
          filtroCliente,
          filtroStatus
        );

        console.log('📋 Agendamentos filtrados:', agendamentosFiltrados.length);

        // Processar em lotes
        const dadosProcessados = await processarAgendamentosBatch(
          agendamentosFiltrados,
          produtosAtivosComCategoria,
          agendamentosCompletos,
          calcularQuantidadesPorProporcao,
          temProporcoesConfiguradas
        );

        console.log('✅ Dados processados:', dadosProcessados.length);
        
        // Salvar no cache
        cacheRef.current.set(chaveCache, dadosProcessados);
        
        // Limitar cache a 10 entradas para evitar vazamento de memória
        if (cacheRef.current.size > 10) {
          const primeiraChave = cacheRef.current.keys().next().value;
          cacheRef.current.delete(primeiraChave);
        }

        setDadosAuditoria(dadosProcessados);
      } catch (error) {
        console.error('❌ Erro ao processar dados de auditoria:', error);
        setDadosAuditoria([]);
      } finally {
        setLoading(false);
        processandoRef.current = false;
      }
    }, 300);
  }, [
    agendamentos,
    produtosAtivosComCategoria,
    agendamentosCompletos,
    calcularQuantidadesPorProporcao,
    temProporcoesConfiguradas,
    gerarChaveCache
  ]);

  // Limpar cache quando dados base mudarem
  const limparCache = useCallback(() => {
    cacheRef.current.clear();
    console.log('🗑️ Cache limpo');
  }, []);

  // Stats para debugging
  const stats = useMemo(() => ({
    totalAgendamentos: agendamentos?.length || 0,
    totalProdutos: produtosAtivosComCategoria?.length || 0,
    dadosProcessados: dadosAuditoria.length,
    cacheSize: cacheRef.current.size
  }), [agendamentos?.length, produtosAtivosComCategoria?.length, dadosAuditoria.length]);

  return {
    dadosAuditoria,
    loading,
    processarDadosAuditoria,
    limparCache,
    stats
  };
};
