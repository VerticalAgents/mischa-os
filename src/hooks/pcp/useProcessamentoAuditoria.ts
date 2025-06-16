
import { useState, useRef, useCallback } from 'react';
import { useAgendamentoClienteStore } from '../useAgendamentoClienteStore';
import { useProporoesPadrao } from '../useProporoesPadrao';
import { useProdutosAtivos } from './useProdutosAtivos';
import { processarAgendamentosBatch, filtrarAgendamentos } from './utils/dataProcessing';
import { AuditoriaItem } from './types';

export const useProcessamentoAuditoria = () => {
  const [dadosAuditoria, setDadosAuditoria] = useState<AuditoriaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const processandoRef = useRef(false);

  const { agendamentos, agendamentosCompletos } = useAgendamentoClienteStore();
  const { produtosAtivosComCategoria } = useProdutosAtivos();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

  const processarDadosAuditoria = useCallback(async (
    dataInicio?: string, 
    dataFim?: string, 
    filtroCliente?: string, 
    filtroStatus?: string
  ) => {
    // Evitar múltiplas execuções simultâneas
    if (processandoRef.current || loading) {
      console.log('⏳ Processamento já em andamento, ignorando nova requisição');
      return;
    }
    
    processandoRef.current = true;
    setLoading(true);
    
    try {
      console.log('🔍 Processando dados de auditoria otimizado...');
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

      // Processar em lotes para melhor performance
      const dadosProcessados = await processarAgendamentosBatch(
        agendamentosFiltrados,
        produtosAtivosComCategoria,
        agendamentosCompletos,
        calcularQuantidadesPorProporcao,
        temProporcoesConfiguradas
      );

      console.log('✅ Dados de auditoria processados:', dadosProcessados.length);
      setDadosAuditoria(dadosProcessados);
    } catch (error) {
      console.error('❌ Erro ao processar dados de auditoria:', error);
      setDadosAuditoria([]);
    } finally {
      setLoading(false);
      processandoRef.current = false;
    }
  }, [
    agendamentos,
    produtosAtivosComCategoria,
    agendamentosCompletos,
    calcularQuantidadesPorProporcao,
    temProporcoesConfiguradas,
    loading
  ]);

  return {
    dadosAuditoria,
    loading,
    processarDadosAuditoria
  };
};
