
import { useEffect, useCallback } from 'react';
import { differenceInHours, isToday } from 'date-fns';
import { useAlertaStore } from '@/hooks/useAlertaStore';
import { Cliente } from '@/types';

interface ClienteComStatus extends Cliente {
  statusConfirmacao: string;
  ultimaAtualizacaoStatus: Date;
}

export const useAutomacaoStatus = () => {
  const { adicionarAlerta } = useAlertaStore();

  // Simular função que obtém clientes com status de confirmação
  const getClientesComStatus = useCallback((): ClienteComStatus[] => {
    // Em uma implementação real, isso viria do store de clientes
    return [];
  }, []);

  // Atualizar status automaticamente após 24h
  const verificarAtualizacaoStatus = useCallback(() => {
    const clientes = getClientesComStatus();
    const agora = new Date();

    clientes.forEach(cliente => {
      const horasDesdeUltimaAtualizacao = differenceInHours(agora, cliente.ultimaAtualizacaoStatus);

      // Mover para "Reenviar após 24h" se estiver "Contatado, sem resposta" há mais de 24h
      if (cliente.statusConfirmacao === "Contatado, sem resposta" && horasDesdeUltimaAtualizacao >= 24) {
        // Em implementação real, atualizar o status no store
        console.log(`Movendo ${cliente.nome} para "Reenviar após 24h"`);
      }

      // Mover para "Verificação presencial" se estiver "Sem resposta após 2º contato" há mais de 24h
      if (cliente.statusConfirmacao === "Sem resposta após 2º contato" && horasDesdeUltimaAtualizacao >= 24) {
        // Em implementação real, atualizar o status no store
        console.log(`Movendo ${cliente.nome} para "Verificação presencial"`);
      }
    });
  }, [getClientesComStatus]);

  // Gerar alertas para entregas do dia
  const verificarEntregasDoDia = useCallback(() => {
    const clientes = getClientesComStatus();
    
    const clientesPendentesHoje = clientes.filter(cliente => {
      if (!cliente.proximaDataReposicao) return false;
      
      const isEntregaHoje = isToday(new Date(cliente.proximaDataReposicao));
      const statusPendente = [
        "Previsto", 
        "Contatado, sem resposta", 
        "Reenviar após 24h"
      ].includes(cliente.statusConfirmacao);
      
      return isEntregaHoje && statusPendente;
    });

    if (clientesPendentesHoje.length > 0) {
      adicionarAlerta({
        tipo: "ProximasEntregas",
        mensagem: `⚠ Ainda há ${clientesPendentesHoje.length} clientes com entrega prevista para hoje que não foram confirmados.`,
        lida: false,
        dados: {
          dataEntrega: new Date().toISOString().split('T')[0],
          quantidadePedidos: clientesPendentesHoje.length,
          idsPedidos: clientesPendentesHoje.map(c => c.id)
        }
      });
    }
  }, [getClientesComStatus, adicionarAlerta]);

  // Executar verificações a cada 30 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      verificarAtualizacaoStatus();
      verificarEntregasDoDia();
    }, 30 * 60 * 1000); // 30 minutos

    // Executar imediatamente também
    verificarAtualizacaoStatus();
    verificarEntregasDoDia();

    return () => clearInterval(interval);
  }, [verificarAtualizacaoStatus, verificarEntregasDoDia]);

  // Função para confirmar entrega e atualizar status automaticamente
  const confirmarEntrega = useCallback((clienteId: number) => {
    // Em implementação real, atualizar o status do cliente para "Confirmado"
    console.log(`Confirmando entrega para cliente ${clienteId} e atualizando status para "Confirmado"`);
    
    // Aqui seria chamado o store para atualizar o status
    // useClienteStore.getState().atualizarStatusConfirmacao(clienteId, "Confirmado");
  }, []);

  return {
    confirmarEntrega,
    verificarAtualizacaoStatus,
    verificarEntregasDoDia
  };
};
