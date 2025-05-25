
export interface ConfiguracoesProducao {
  unidadesPorForma: number;
  formasPorLote: number;
  incluirPedidosPrevistos: boolean;
  percentualPedidosPrevistos: number;
  tempoMedioPorFornada: number; // em minutos
  unidadesBrowniePorForma: number;
  formasPorFornada: number;
}

export interface PlanejamentoProducao {
  id: number;
  dataPlanejamento: Date;
  dataProducao: Date;
  status: 'Pendente' | 'Em Produção' | 'Concluído' | 'Cancelado';
  itensPlanejamento: {
    idSabor: number;
    nomeSabor: string;
    quantidadePlanejada: number;
    quantidadeProduzida?: number;
  }[];
  observacoes?: string;
  totalUnidades: number;
  // Additional properties needed for usePlanejamentoProducaoStore
  totalUnidadesAgendadas?: number;
  formasNecessarias?: number;
}

// Add new type for production history
export interface HistoricoProducao {
  id: number;
  dataProducao: Date;
  produtoId: number;
  produtoNome: string;
  formasProducidas: number;
  unidadesCalculadas: number;
  turno: string;
  observacoes?: string;
  origem: 'Agendada' | 'Manual'; // Track where the production came from
}
