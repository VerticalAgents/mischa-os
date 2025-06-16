
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { useProdutosAtivos } from './pcp/useProdutosAtivos';
import { useProcessamentoAuditoria } from './pcp/useProcessamentoAuditoria';

export type { AuditoriaItem, ProdutoComCategoria } from './pcp/types';

export const useAuditoriaPCPData = () => {
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const carregandoRef = useRef(false);
  
  const { carregarTodosAgendamentos, agendamentos } = useAgendamentoClienteStore();
  const { produtosAtivosComCategoria } = useProdutosAtivos();
  const { dadosAuditoria, loading, processarDadosAuditoria } = useProcessamentoAuditoria();

  // Função para carregar dados iniciais apenas uma vez
  const inicializarDados = useCallback(async () => {
    if (carregandoRef.current || inicializado) {
      return;
    }
    
    carregandoRef.current = true;
    
    try {
      console.log('🚀 Inicializando dados do PCP...');
      await carregarTodosAgendamentos();
      setInicializado(true);
      setDadosCarregados(true);
      console.log('✅ Dados do PCP inicializados');
    } catch (error) {
      console.error('❌ Erro ao inicializar dados do PCP:', error);
      setDadosCarregados(false);
    } finally {
      carregandoRef.current = false;
    }
  }, [carregarTodosAgendamentos, inicializado]);

  // Inicializar apenas na primeira montagem
  useEffect(() => {
    if (!inicializado && !carregandoRef.current) {
      inicializarDados();
    }
  }, [inicializarDados, inicializado]);

  return {
    dadosAuditoria,
    produtosAtivos: produtosAtivosComCategoria,
    loading: loading || carregandoRef.current,
    processarDadosAuditoria,
    dadosCarregados: dadosCarregados && !carregandoRef.current,
    inicializado,
    totalAgendamentos: agendamentos.length
  };
};
