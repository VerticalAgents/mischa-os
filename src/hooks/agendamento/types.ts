
export interface AgendamentoCliente {
  id?: string;
  cliente_id: string;
  tipo_pedido: 'Padrão' | 'Alterado';
  status_agendamento: 'Agendar' | 'Previsto' | 'Agendado';
  data_proxima_reposicao?: Date;
  quantidade_total: number;
  itens_personalizados?: { produto: string; quantidade: number }[];
  substatus_pedido?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AgendamentoClienteStore {
  agendamentos: import('@/components/agendamento/types').AgendamentoItem[];
  agendamentosCompletos: Map<string, AgendamentoCliente>;
  loading: boolean;
  error: string | null;
  
  // Actions
  carregarTodosAgendamentos: () => Promise<void>;
  carregarAgendamentoPorCliente: (clienteId: string) => Promise<AgendamentoCliente | null>;
  obterAgendamento: (clienteId: string) => Promise<AgendamentoCliente | null>;
  salvarAgendamento: (clienteId: string, dadosAgendamento: Partial<AgendamentoCliente>) => Promise<void>;
  criarAgendamentoSeNaoExiste: (clienteId: string, dadosIniciais: Partial<AgendamentoCliente>) => Promise<void>;
  limparErro: () => void;
}
