import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

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

export interface HistoricoGiroSemanal {
  cliente_id: string;
  semana: string;
  giro_semanal: number;
  giro_categoria: Record<string, number>;
}

export interface GiroAnalysisFilters {
  representante?: string;
  rota?: string;
  categoria_estabelecimento?: string;
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

// Helper function to safely parse JSON arrays
function parseJsonArray(jsonValue: Json): number[] | null {
  if (!jsonValue) return null;
  
  try {
    if (Array.isArray(jsonValue)) {
      return jsonValue.filter(item => typeof item === 'number') as number[];
    }
    
    if (typeof jsonValue === 'string') {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed)) {
        return parsed.filter(item => typeof item === 'number') as number[];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing JSON array:', error);
    return null;
  }
}

// Cache para giros em batch
let girosCache: Map<string, number> | null = null;
let girosCacheTimestamp: number = 0;
const GIROS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Função para carregar giros em batch (1 query para todos os clientes)
async function carregarGirosEmBatch(clienteIds: string[]): Promise<Map<string, number>> {
  const now = Date.now();
  
  // Se cache válido, usar
  if (girosCache && (now - girosCacheTimestamp) < GIROS_CACHE_DURATION) {
    return girosCache;
  }

  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 84); // 12 semanas

    const { data: entregas, error } = await supabase
      .from('historico_entregas')
      .select('cliente_id, quantidade, data')
      .eq('tipo', 'entrega')
      .gte('data', dataLimite.toISOString());

    if (error) {
      console.error('Erro ao carregar giros em batch:', error);
      return new Map();
    }

    // Agregar por cliente
    const totaisPorCliente: Record<string, { total: number; primeiraEntrega: Date | null }> = {};
    
    entregas?.forEach(e => {
      if (!totaisPorCliente[e.cliente_id]) {
        totaisPorCliente[e.cliente_id] = { total: 0, primeiraEntrega: null };
      }
      totaisPorCliente[e.cliente_id].total += e.quantidade || 0;
      
      const dataEntrega = new Date(e.data);
      if (!totaisPorCliente[e.cliente_id].primeiraEntrega || 
          dataEntrega < totaisPorCliente[e.cliente_id].primeiraEntrega!) {
        totaisPorCliente[e.cliente_id].primeiraEntrega = dataEntrega;
      }
    });

    // Calcular média semanal considerando semanas desde primeira entrega
    const resultado = new Map<string, number>();
    const agora = new Date();
    
    Object.entries(totaisPorCliente).forEach(([clienteId, dados]) => {
      if (dados.primeiraEntrega) {
        const diasDesdeInicio = Math.floor(
          (agora.getTime() - dados.primeiraEntrega.getTime()) / (1000 * 60 * 60 * 24)
        );
        const semanasReais = Math.max(1, Math.min(12, Math.ceil(diasDesdeInicio / 7)));
        resultado.set(clienteId, Math.round(dados.total / semanasReais));
      } else {
        resultado.set(clienteId, 0);
      }
    });

    girosCache = resultado;
    girosCacheTimestamp = now;
    
    return resultado;
  } catch (error) {
    console.error('Erro ao carregar giros em batch:', error);
    return new Map();
  }
}

// Helper function to transform database row to our interface (SÍNCRONO com mapa de giros)
function transformDatabaseRowSync(row: any, girosMap: Map<string, number>): DadosAnaliseGiroConsolidados {
  // Usar giro do mapa pré-carregado
  const giroHistoricoCorreto = girosMap.get(row.cliente_id) || 0;
  
  // Recalcular métricas baseadas no giro histórico correto
  const metaGiroSemanal = row.meta_giro_semanal || 0;
  const achievement = metaGiroSemanal > 0 ? (giroHistoricoCorreto / metaGiroSemanal) * 100 : 0;
  
  // Calcular semáforo baseado no achievement
  let semaforo: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
  if (achievement >= 90) {
    semaforo = 'verde';
  } else if (achievement >= 70) {
    semaforo = 'amarelo';
  }

  return {
    cliente_id: row.cliente_id,
    cliente_nome: row.cliente_nome,
    status_cliente: row.status_cliente,
    cnpj_cpf: row.cnpj_cpf,
    endereco_entrega: row.endereco_entrega,
    contato_nome: row.contato_nome,
    contato_telefone: row.contato_telefone,
    contato_email: row.contato_email,
    quantidade_padrao: row.quantidade_padrao,
    periodicidade_padrao: row.periodicidade_padrao,
    meta_giro_semanal: row.meta_giro_semanal,
    categorias_habilitadas: parseJsonArray(row.categorias_habilitadas),
    representante_nome: row.representante_nome,
    rota_entrega_nome: row.rota_entrega_nome,
    categoria_estabelecimento_nome: row.categoria_estabelecimento_nome,
    giro_semanal_calculado: Number(row.giro_semanal_calculado || 0),
    giro_medio_historico: giroHistoricoCorreto,
    giro_ultima_semana: Number(row.giro_ultima_semana || 0),
    desvio_padrao_giro: Number(row.desvio_padrao_giro || 0),
    variacao_percentual: Number(row.variacao_percentual || 0),
    achievement_meta: Math.round(achievement),
    semaforo_performance: semaforo,
    faturamento_semanal_previsto: Number(row.faturamento_semanal_previsto || 0),
    created_at: row.created_at,
    updated_at: row.updated_at,
    data_consolidacao: row.data_consolidacao,
  };
}

export class GiroAnalysisService {
  // Cache management
  private static async getCachedData(tipo: string, filtros: GiroAnalysisFilters = {}): Promise<any> {
    const { data, error } = await supabase
      .from('cache_analise_giro')
      .select('dados')
      .eq('tipo_analise', tipo)
      .eq('filtros', JSON.stringify(filtros))
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (error) {
      console.error('Error retrieving cached data:', error);
      return null;
    }

    return data?.[0]?.dados || null;
  }

  private static async setCachedData(tipo: string, filtros: GiroAnalysisFilters, dados: any): Promise<void> {
    const { error } = await supabase
      .from('cache_analise_giro')
      .insert({
        tipo_analise: tipo,
        filtros: JSON.stringify(filtros),
        dados: dados,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
      });

    if (error) {
      console.error('Error caching data:', error);
    }
  }

  // Refresh materialized view
  static async refreshMaterializedView(): Promise<void> {
    const { error } = await supabase.rpc('refresh_dados_analise_giro');
    if (error) {
      console.error('Error refreshing materialized view:', error);
      throw error;
    }
  }

  // Populate historical giro data
  static async populateHistoricalData(): Promise<void> {
    const { error } = await supabase.rpc('populate_historico_giro_semanal');
    if (error) {
      console.error('Error populating historical data:', error);
      throw error;
    }
  }

  // Get consolidated giro data - uses admin-only RPC function for security
  static async getDadosConsolidados(filtros: GiroAnalysisFilters = {}): Promise<DadosAnaliseGiroConsolidados[]> {
    // Use RPC function that checks admin role (materialized views don't support RLS)
    const { data, error } = await supabase.rpc('get_dados_analise_giro_admin');

    if (error) {
      console.error('Error fetching consolidated data:', error);
      throw error;
    }

    // Apply filters client-side (RPC doesn't support filtering)
    let filteredData = data || [];
    
    if (filtros.representante) {
      filteredData = filteredData.filter(row => row.representante_nome === filtros.representante);
    }
    if (filtros.rota) {
      filteredData = filteredData.filter(row => row.rota_entrega_nome === filtros.rota);
    }
    if (filtros.categoria_estabelecimento) {
      filteredData = filteredData.filter(row => row.categoria_estabelecimento_nome === filtros.categoria_estabelecimento);
    }

    // Sort by client name
    filteredData.sort((a, b) => (a.cliente_nome || '').localeCompare(b.cliente_nome || ''));

    // Carregar todos os giros em batch (1 query para todos)
    const clienteIds = filteredData.map(row => row.cliente_id);
    const girosMap = await carregarGirosEmBatch(clienteIds);

    // Transform data de forma síncrona usando o mapa pré-carregado
    const transformedData = filteredData.map(row => transformDatabaseRowSync(row, girosMap));

    // Reordenar por giro histórico correto
    const sortedData = transformedData.sort((a, b) => b.giro_medio_historico - a.giro_medio_historico);
    
    return sortedData;
  }

  // Get client ranking
  static async getGiroRanking(filtros: GiroAnalysisFilters = {}): Promise<GiroRanking[]> {
    const cacheKey = 'ranking';
    const cached = await this.getCachedData(cacheKey, filtros);
    
    if (cached) {
      return cached;
    }

    const dados = await this.getDadosConsolidados(filtros);
    
    const ranking: GiroRanking[] = dados
      .sort((a, b) => b.giro_medio_historico - a.giro_medio_historico)
      .map((item, index) => {
        const giroAnterior = item.giro_medio_historico - (item.giro_ultima_semana - item.giro_medio_historico);
        const variacao = item.variacao_percentual;
        
        let tendencia: 'crescimento' | 'queda' | 'estavel' = 'estavel';
        if (variacao > 5) tendencia = 'crescimento';
        else if (variacao < -5) tendencia = 'queda';

        return {
          posicao: index + 1,
          cliente_id: item.cliente_id,
          cliente_nome: item.cliente_nome,
          giro_atual: item.giro_medio_historico,
          giro_anterior: giroAnterior,
          tendencia,
          variacao_percentual: variacao,
          achievement_meta: item.achievement_meta
        };
      });

    await this.setCachedData(cacheKey, filtros, ranking);
    return ranking;
  }

  // Get temporal data for specific client
  static async getGiroTemporal(clienteId: string): Promise<GiroTemporalData | null> {
    const cacheKey = `temporal_${clienteId}`;
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const { data: historico, error } = await supabase
      .from('historico_giro_semanal_consolidado')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('semana', { ascending: true })
      .limit(12);

    if (error) {
      console.error('Error fetching temporal data:', error);
      return null;
    }

    if (!historico || historico.length === 0) {
      return null;
    }

    const historico12Semanas = historico.map(item => ({
      semana: item.semana,
      giro: item.giro_semanal
    }));

    const mediaMovel4Semanas = historico.slice(-4).reduce((acc, item) => acc + item.giro_semanal, 0) / 4;
    
    // Calculate trend
    const primeiraMetade = historico.slice(0, 6).reduce((acc, item) => acc + item.giro_semanal, 0) / 6;
    const segundaMetade = historico.slice(6).reduce((acc, item) => acc + item.giro_semanal, 0) / 6;
    const diferencaPercentual = ((segundaMetade - primeiraMetade) / primeiraMetade) * 100;
    
    let tendenciaGeral: 'crescimento' | 'queda' | 'estavel' = 'estavel';
    if (diferencaPercentual > 10) tendenciaGeral = 'crescimento';
    else if (diferencaPercentual < -10) tendenciaGeral = 'queda';

    // Basic seasonality calculation (simplified)
    const sazonalidade = historico.reduce((acc, item, index) => {
      const semana = index + 1;
      acc[`semana_${semana}`] = item.giro_semanal;
      return acc;
    }, {} as Record<string, number>);

    const result: GiroTemporalData = {
      cliente_id: clienteId,
      historico_12_semanas: historico12Semanas,
      media_movel_4_semanas: mediaMovel4Semanas,
      tendencia_geral: tendenciaGeral,
      sazonalidade
    };

    await this.setCachedData(cacheKey, {}, result);
    return result;
  }

  // Get regional performance data
  static async getGiroRegional(filtros: GiroAnalysisFilters = {}): Promise<GiroRegionalData[]> {
    const cacheKey = 'regional';
    const cached = await this.getCachedData(cacheKey, filtros);
    
    if (cached) {
      return cached;
    }

    const dados = await this.getDadosConsolidados(filtros);
    
    const regional = dados.reduce((acc, item) => {
      const rota = item.rota_entrega_nome || 'Sem rota';
      
      if (!acc[rota]) {
        acc[rota] = {
          rota_entrega: rota,
          total_clientes: 0,
          giro_total: 0,
          achievement_total: 0,
          faturamento_total: 0,
          performance_counts: { verde: 0, amarelo: 0, vermelho: 0 }
        };
      }

      acc[rota].total_clientes++;
      acc[rota].giro_total += item.giro_medio_historico;
      acc[rota].achievement_total += item.achievement_meta;
      acc[rota].faturamento_total += item.faturamento_semanal_previsto;
      acc[rota].performance_counts[item.semaforo_performance]++;

      return acc;
    }, {} as Record<string, any>);

    const result: GiroRegionalData[] = Object.values(regional).map((item: any) => {
      const giroMedio = item.giro_total / item.total_clientes;
      const achievementMedio = item.achievement_total / item.total_clientes;
      
      // Determine overall performance
      let performanceGeral: 'verde' | 'amarelo' | 'vermelho' = 'vermelho';
      if (item.performance_counts.verde > item.performance_counts.amarelo && 
          item.performance_counts.verde > item.performance_counts.vermelho) {
        performanceGeral = 'verde';
      } else if (item.performance_counts.amarelo > item.performance_counts.vermelho) {
        performanceGeral = 'amarelo';
      }

      return {
        rota_entrega: item.rota_entrega,
        total_clientes: item.total_clientes,
        giro_medio: Math.round(giroMedio),
        achievement_medio: Math.round(achievementMedio),
        faturamento_previsto: Math.round(item.faturamento_total),
        performance_geral: performanceGeral
      };
    });

    await this.setCachedData(cacheKey, filtros, result);
    return result;
  }

  // Get prediction data for specific client
  static async getGiroPredicao(clienteId: string): Promise<GiroPredicao | null> {
    const cacheKey = `predicao_${clienteId}`;
    const cached = await this.getCachedData(cacheKey);
    
    if (cached) {
      return cached;
    }

    const temporal = await this.getGiroTemporal(clienteId);
    if (!temporal) return null;

    const dados = await this.getDadosConsolidados();
    const clienteData = dados.find(d => d.cliente_id === clienteId);
    if (!clienteData) return null;

    // Simple prediction based on moving average and trend
    const mediaMovel = temporal.media_movel_4_semanas;
    const tendencia = temporal.tendencia_geral;
    
    let previsaoProximaSemana = mediaMovel;
    if (tendencia === 'crescimento') {
      previsaoProximaSemana = mediaMovel * 1.1;
    } else if (tendencia === 'queda') {
      previsaoProximaSemana = mediaMovel * 0.9;
    }

    const desvio = clienteData.desvio_padrao_giro;
    const intervaloConfianca = {
      min: Math.max(0, previsaoProximaSemana - desvio),
      max: previsaoProximaSemana + desvio
    };

    const probabilidadeMeta = clienteData.meta_giro_semanal && clienteData.meta_giro_semanal > 0 
      ? Math.min(100, (previsaoProximaSemana / clienteData.meta_giro_semanal) * 100)
      : 0;

    const result: GiroPredicao = {
      cliente_id: clienteId,
      previsao_proxima_semana: Math.round(previsaoProximaSemana),
      intervalo_confianca: {
        min: Math.round(intervaloConfianca.min),
        max: Math.round(intervaloConfianca.max)
      },
      fatores_sazonais: temporal.sazonalidade,
      probabilidade_meta: Math.round(probabilidadeMeta)
    };

    await this.setCachedData(cacheKey, {}, result);
    return result;
  }

  // Get overview statistics
  static async getGiroOverview(filtros: GiroAnalysisFilters = {}): Promise<{
    totalClientes: number;
    giroMedioGeral: number;
    taxaAtingimentoGlobal: number;
    distribuicaoSemaforo: Record<string, number>;
    faturamentoTotalPrevisto: number;
  }> {
    const cacheKey = 'overview';
    const cached = await this.getCachedData(cacheKey, filtros);
    
    if (cached) {
      return cached;
    }

    const dados = await this.getDadosConsolidados(filtros);
    
    const totalClientes = dados.length;
    const giroMedioGeral = dados.reduce((acc, item) => acc + item.giro_medio_historico, 0) / totalClientes;
    const taxaAtingimentoGlobal = dados.reduce((acc, item) => acc + item.achievement_meta, 0) / totalClientes;
    const faturamentoTotalPrevisto = dados.reduce((acc, item) => acc + item.faturamento_semanal_previsto, 0);
    
    const distribuicaoSemaforo = dados.reduce((acc, item) => {
      acc[item.semaforo_performance] = (acc[item.semaforo_performance] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = {
      totalClientes,
      giroMedioGeral: Math.round(giroMedioGeral),
      taxaAtingimentoGlobal: Math.round(taxaAtingimentoGlobal),
      distribuicaoSemaforo,
      faturamentoTotalPrevisto: Math.round(faturamentoTotalPrevisto)
    };

    await this.setCachedData(cacheKey, filtros, result);
    return result;
  }

  // Clear cache for specific type or all
  static async clearCache(tipo?: string): Promise<void> {
    let query = supabase.from('cache_analise_giro').delete();
    
    if (tipo) {
      query = query.eq('tipo_analise', tipo);
    } else {
      query = query.neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    }

    const { error } = await query;
    if (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
