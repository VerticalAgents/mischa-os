
import { useState, useEffect } from 'react';
import { useAgendamentoClienteStore } from './useAgendamentoClienteStore';
import { useProdutosAtivos } from './pcp/useProdutosAtivos';
import { useProcessamentoAuditoria } from './pcp/useProcessamentoAuditoria';

export type { AuditoriaItem, ProdutoComCategoria } from './pcp/types';

export const useAuditoriaPCPData = () => {
  const [dadosCarregados, setDadosCarregados] = useState(false);
  
  const { carregarTodosAgendamentos } = useAgendamentoClienteStore();
  const { produtosAtivosComCategoria } = useProdutosAtivos();
  const { dadosAuditoria, loading, processarDadosAuditoria } = useProcessamentoAuditoria();

  // Carregar agendamentos apenas uma vez
  useEffect(() => {
    let isMounted = true;
    
    const carregarDados = async () => {
      if (!dadosCarregados && isMounted) {
        try {
          await carregarTodosAgendamentos();
          setDadosCarregados(true);
        } catch (error) {
          console.error('Erro ao carregar agendamentos:', error);
        }
      }
    };

    carregarDados();

    return () => {
      isMounted = false;
    };
  }, [carregarTodosAgendamentos, dadosCarregados]);

  return {
    dadosAuditoria,
    produtosAtivos: produtosAtivosComCategoria,
    loading,
    processarDadosAuditoria,
    dadosCarregados
  };
};
