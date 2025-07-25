
-- Create a consolidated view for giro analysis data
CREATE OR REPLACE VIEW dados_analise_giro_consolidados AS
WITH 
-- Calculate weekly giro from historical deliveries
giro_historico AS (
  SELECT 
    cliente_id,
    DATE_TRUNC('week', data) as semana,
    SUM(quantidade) as giro_semanal
  FROM historico_entregas
  WHERE data >= NOW() - INTERVAL '12 weeks'
  GROUP BY cliente_id, DATE_TRUNC('week', data)
),

-- Calculate average giro for last 4 weeks
giro_medio_4_semanas AS (
  SELECT 
    cliente_id,
    AVG(giro_semanal) as giro_medio_historico,
    STDDEV(giro_semanal) as desvio_padrao_giro
  FROM giro_historico
  WHERE semana >= DATE_TRUNC('week', NOW()) - INTERVAL '4 weeks'
  GROUP BY cliente_id
),

-- Get last week's giro
giro_ultima_semana AS (
  SELECT 
    cliente_id,
    COALESCE(giro_semanal, 0) as giro_ultima_semana
  FROM giro_historico
  WHERE semana = DATE_TRUNC('week', NOW()) - INTERVAL '1 week'
),

-- Calculate giro by category for each client
giro_por_categoria AS (
  SELECT 
    c.id as cliente_id,
    cp.id as categoria_id,
    cp.nome as categoria_nome,
    COALESCE(gsp.giro_semanal, 
      CASE 
        WHEN c.periodicidade_padrao > 0 
        THEN ROUND((c.quantidade_padrao::numeric / c.periodicidade_padrao) * 7)
        ELSE 0
      END
    ) as giro_semanal_categoria
  FROM clientes c
  CROSS JOIN categorias_produto cp
  LEFT JOIN giros_semanais_personalizados gsp 
    ON c.id = gsp.cliente_id AND cp.id = gsp.categoria_id
  WHERE c.ativo = true 
    AND cp.ativo = true
    AND (c.categorias_habilitadas @> to_jsonb(cp.id) OR c.categorias_habilitadas IS NULL)
),

-- Calculate pricing by category for each client
precos_por_categoria AS (
  SELECT 
    c.id as cliente_id,
    cp.id as categoria_id,
    COALESCE(pcc.preco_unitario, 5.0) as preco_unitario,
    CASE WHEN pcc.id IS NOT NULL THEN true ELSE false END as preco_personalizado
  FROM clientes c
  CROSS JOIN categorias_produto cp
  LEFT JOIN precos_categoria_cliente pcc 
    ON c.id = pcc.cliente_id AND cp.id = pcc.categoria_id
  WHERE c.ativo = true AND cp.ativo = true
)

-- Main consolidated query
SELECT 
  c.id as cliente_id,
  c.nome as cliente_nome,
  c.status_cliente,
  c.cnpj_cpf,
  c.endereco_entrega,
  c.contato_nome,
  c.contato_telefone,
  c.contato_email,
  c.quantidade_padrao,
  c.periodicidade_padrao,
  c.meta_giro_semanal,
  c.categorias_habilitadas,
  
  -- Representative and route data
  r.nome as representante_nome,
  re.nome as rota_entrega_nome,
  ce.nome as categoria_estabelecimento_nome,
  
  -- Calculated giro metrics
  CASE 
    WHEN c.periodicidade_padrao > 0 
    THEN ROUND((c.quantidade_padrao::numeric / c.periodicidade_padrao) * 7)
    ELSE 0
  END as giro_semanal_calculado,
  
  COALESCE(gm4.giro_medio_historico, 0) as giro_medio_historico,
  COALESCE(gus.giro_ultima_semana, 0) as giro_ultima_semana,
  COALESCE(gm4.desvio_padrao_giro, 0) as desvio_padrao_giro,
  
  -- Performance indicators
  CASE 
    WHEN gm4.giro_medio_historico > 0 AND gus.giro_ultima_semana > 0
    THEN ROUND(((gus.giro_ultima_semana - gm4.giro_medio_historico) / gm4.giro_medio_historico) * 100, 2)
    ELSE 0
  END as variacao_percentual,
  
  CASE 
    WHEN c.meta_giro_semanal > 0 AND gm4.giro_medio_historico > 0
    THEN ROUND((gm4.giro_medio_historico / c.meta_giro_semanal) * 100, 2)
    ELSE 0
  END as achievement_meta,
  
  -- Traffic light indicator
  CASE 
    WHEN c.meta_giro_semanal > 0 AND gm4.giro_medio_historico > 0 THEN
      CASE 
        WHEN (gm4.giro_medio_historico / c.meta_giro_semanal) >= 0.9 THEN 'verde'
        WHEN (gm4.giro_medio_historico / c.meta_giro_semanal) >= 0.7 THEN 'amarelo'
        ELSE 'vermelho'
      END
    ELSE 'vermelho'
  END as semaforo_performance,
  
  -- Financial metrics
  CASE 
    WHEN c.periodicidade_padrao > 0 
    THEN ROUND((c.quantidade_padrao::numeric / c.periodicidade_padrao) * 7) * 5.0
    ELSE 0
  END as faturamento_semanal_previsto,
  
  -- Timestamps
  c.created_at,
  c.updated_at,
  NOW() as data_consolidacao

FROM clientes c
LEFT JOIN representantes r ON c.representante_id = r.id
LEFT JOIN rotas_entrega re ON c.rota_entrega_id = re.id
LEFT JOIN categorias_estabelecimento ce ON c.categoria_estabelecimento_id = ce.id
LEFT JOIN giro_medio_4_semanas gm4 ON c.id = gm4.cliente_id
LEFT JOIN giro_ultima_semana gus ON c.id = gus.cliente_id
WHERE c.ativo = true;

-- Create materialized view for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS dados_analise_giro_materialized AS
SELECT * FROM dados_analise_giro_consolidados;

-- Create unique index for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_dados_giro_cliente_id 
ON dados_analise_giro_materialized (cliente_id);

-- Create additional performance indexes
CREATE INDEX IF NOT EXISTS idx_dados_giro_semaforo 
ON dados_analise_giro_materialized (semaforo_performance);

CREATE INDEX IF NOT EXISTS idx_dados_giro_representante 
ON dados_analise_giro_materialized (representante_nome);

CREATE INDEX IF NOT EXISTS idx_dados_giro_rota 
ON dados_analise_giro_materialized (rota_entrega_nome);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dados_analise_giro()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dados_analise_giro_materialized;
END;
$$ LANGUAGE plpgsql;

-- Create table for storing historical giro data (12 weeks)
CREATE TABLE IF NOT EXISTS historico_giro_semanal_consolidado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  semana DATE NOT NULL,
  giro_semanal INTEGER NOT NULL DEFAULT 0,
  giro_categoria JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cliente_id, semana)
);

-- Enable RLS on the historical table
ALTER TABLE historico_giro_semanal_consolidado ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for historical giro data
CREATE POLICY "Allow all operations on historico_giro_semanal_consolidado"
ON historico_giro_semanal_consolidado
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to populate historical giro data
CREATE OR REPLACE FUNCTION populate_historico_giro_semanal()
RETURNS void AS $$
BEGIN
  INSERT INTO historico_giro_semanal_consolidado (cliente_id, semana, giro_semanal)
  SELECT 
    cliente_id,
    DATE_TRUNC('week', data)::date as semana,
    SUM(quantidade) as giro_semanal
  FROM historico_entregas
  WHERE data >= NOW() - INTERVAL '12 weeks'
  GROUP BY cliente_id, DATE_TRUNC('week', data)
  ON CONFLICT (cliente_id, semana) 
  DO UPDATE SET 
    giro_semanal = EXCLUDED.giro_semanal,
    created_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create table for giro analysis cache
CREATE TABLE IF NOT EXISTS cache_analise_giro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_analise TEXT NOT NULL,
  filtros JSONB DEFAULT '{}',
  dados JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Enable RLS on cache table
ALTER TABLE cache_analise_giro ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for cache
CREATE POLICY "Allow all operations on cache_analise_giro"
ON cache_analise_giro
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for cache lookups
CREATE INDEX IF NOT EXISTS idx_cache_analise_tipo_filtros 
ON cache_analise_giro (tipo_analise, filtros);

CREATE INDEX IF NOT EXISTS idx_cache_analise_expires 
ON cache_analise_giro (expires_at);
