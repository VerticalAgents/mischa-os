
export interface DadosAnaliseGiroConsolidados {
  cliente_id: string;
  cliente_nome: string;
  status_cliente: string;
  cnpj_cpf: string | null;
  endereco_entrega: string | null;
  contato_nome: string | null;
  contato_telefone: string | null;
  contato_email: string | null;
  quantidade_padrao: number | null;
  periodicidade_padrao: number | null;
  meta_giro_semanal: number | null;
  categorias_habilitadas: number[] | null;
  representante_nome: string | null;
  rota_entrega_nome: string | null;
  categoria_estabelecimento_nome: string | null;
  giro_semanal_calculado: number;
  giro_medio_historico: number;
  giro_ultima_semana: number;
  desvio_padrao_giro: number;
  variacao_percentual: number;
  achievement_meta: number;
  semaforo_performance: 'verde' | 'amarelo' | 'vermelho';
  faturamento_semanal_previsto: number;
  created_at: string;
  updated_at: string;
  data_consolidacao: string;
}

export interface GiroAnalysisFilters {
  representante?: string;
  rota?: string;
  categoria_estabelecimento?: string;
  semaforo?: 'verde' | 'amarelo' | 'vermelho';
  achievement_min?: number;
  achievement_max?: number;
}

export interface GiroOverview {
  totalClientes: number;
  giroMedioGeral: number;
  taxaAtingimentoGlobal: number;
  distribuicaoSemaforo: Record<string, number>;
  faturamentoTotalPrevisto: number;
}

export interface GiroRanking {
  posicao: number;
  cliente_id: string;
  cliente_nome: string;
  giro_atual: number;
  giro_anterior: number;
  tendencia: 'crescimento' | 'queda' | 'estavel';
  variacao_percentual: number;
  achievement_meta: number;
}

export interface GiroTemporalData {
  cliente_id: string;
  historico_12_semanas: Array<{
    semana: string;
    giro: number;
  }>;
  media_movel_4_semanas: number;
  tendencia_geral: 'crescimento' | 'queda' | 'estavel';
  sazonalidade: Record<string, number>;
}

export interface GiroRegionalData {
  rota_entrega: string;
  total_clientes: number;
  giro_medio: number;
  achievement_medio: number;
  faturamento_previsto: number;
  performance_geral: 'verde' | 'amarelo' | 'vermelho';
}

export interface GiroPredicao {
  cliente_id: string;
  previsao_proxima_semana: number;
  intervalo_confianca: {
    min: number;
    max: number;
  };
  fatores_sazonais: Record<string, number>;
  probabilidade_meta: number;
}
