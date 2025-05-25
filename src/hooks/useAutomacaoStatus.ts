
import { Cliente } from "../types";

export type StatusAutomacao = 
  | "Pendente de Contato"
  | "Aguardando Retorno"
  | "Confirmado"
  | "Reagendado"
  | "Sem Necessidade"
  | "Segundo Contato";

export interface ClienteComStatus extends Cliente {
  statusAutomacao: StatusAutomacao;
  observacoes?: string;
}

export function calcularStatusAutomacao(cliente: Cliente): StatusAutomacao {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  // Se não tem próxima data de reposição, não precisa de confirmação
  if (!cliente.proxima_data_reposicao) {
    return "Sem Necessidade";
  }
  
  const proximaData = new Date(cliente.proxima_data_reposicao);
  proximaData.setHours(0, 0, 0, 0);
  
  const diasParaReposicao = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  
  // Lógica baseada no status de agendamento
  const statusAgendamento = cliente.status_agendamento;
  
  if (statusAgendamento === "Confirmado") {
    return "Confirmado";
  }
  
  if (statusAgendamento === "Reagendar") {
    return "Reagendado";
  }
  
  // Se está dentro da janela de confirmação (3-7 dias antes)
  if (diasParaReposicao >= 0 && diasParaReposicao <= 7) {
    if (statusAgendamento === "Contatado") {
      return "Aguardando Retorno";
    }
    
    if (statusAgendamento === "Segundo Contato") {
      return "Segundo Contato";
    }
    
    return "Pendente de Contato";
  }
  
  // Se passou da data e não foi confirmado
  if (diasParaReposicao < 0) {
    return "Segundo Contato";
  }
  
  return "Sem Necessidade";
}

export function useAutomacaoStatus() {
  const processarClientes = (clientes: Cliente[]): ClienteComStatus[] => {
    return clientes.map(cliente => ({
      ...cliente,
      statusAutomacao: calcularStatusAutomacao(cliente)
    }));
  };

  const filtrarPorStatus = (clientesComStatus: ClienteComStatus[], status: StatusAutomacao): ClienteComStatus[] => {
    return clientesComStatus.filter(cliente => cliente.statusAutomacao === status);
  };

  return {
    processarClientes,
    filtrarPorStatus,
    calcularStatusAutomacao
  };
}
