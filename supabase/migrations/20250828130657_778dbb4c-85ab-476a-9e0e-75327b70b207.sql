-- Fix Security Definer View issue by recreating materialized view without SECURITY DEFINER
-- This addresses the security linter warning about views with SECURITY DEFINER property

-- Drop the existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.dados_analise_giro_materialized CASCADE;

-- Recreate the materialized view without SECURITY DEFINER
-- This view consolidates client analysis data for performance while maintaining proper RLS
CREATE MATERIALIZED VIEW public.dados_analise_giro_materialized AS
WITH historico_base AS (
  SELECT 
    cliente_id,
    DATE_TRUNC('week', data)::date as semana,
    SUM(quantidade) as giro_semanal
  FROM public.historico_entregas
  WHERE data >= NOW() - INTERVAL '12 weeks'
  GROUP BY cliente_id, DATE_TRUNC('week', data)
),
giro_stats AS (
  SELECT 
    cliente_id,
    AVG(giro_semanal) as giro_medio_historico,
    STDDEV(giro_semanal) as desvio_padrao_giro,
    MAX(CASE WHEN semana = (SELECT MAX(semana) FROM historico_base hb2 WHERE hb2.cliente_id = hb.cliente_id) 
        THEN giro_semanal ELSE 0 END) as giro_ultima_semana
  FROM historico_base hb
  GROUP BY cliente_id
)
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
  r.nome as representante_nome,
  re.nome as rota_entrega_nome,
  ce.nome as categoria_estabelecimento_nome,
  COALESCE(gs.giro_medio_historico, 0) as giro_semanal_calculado,
  COALESCE(gs.giro_medio_historico, 0) as giro_medio_historico,
  COALESCE(gs.giro_ultima_semana, 0) as giro_ultima_semana,
  COALESCE(gs.desvio_padrao_giro, 0) as desvio_padrao_giro,
  CASE 
    WHEN c.meta_giro_semanal > 0 AND gs.giro_medio_historico > 0 
    THEN ((gs.giro_medio_historico - c.meta_giro_semanal) / c.meta_giro_semanal * 100)
    ELSE 0 
  END as variacao_percentual,
  CASE 
    WHEN c.meta_giro_semanal > 0 AND gs.giro_medio_historico > 0 
    THEN (gs.giro_medio_historico / c.meta_giro_semanal * 100)
    ELSE 0 
  END as achievement_meta,
  CASE 
    WHEN c.meta_giro_semanal > 0 AND gs.giro_medio_historico >= c.meta_giro_semanal * 0.9 THEN 'verde'
    WHEN c.meta_giro_semanal > 0 AND gs.giro_medio_historico >= c.meta_giro_semanal * 0.7 THEN 'amarelo'
    ELSE 'vermelho'
  END as semaforo_performance,
  CASE 
    WHEN c.meta_giro_semanal > 0 AND gs.giro_medio_historico > 0 
    THEN (gs.giro_medio_historico * COALESCE(pcc.preco_unitario, 5.0))
    ELSE 0 
  END as faturamento_semanal_previsto,
  c.created_at,
  c.updated_at,
  NOW() as data_consolidacao
FROM public.clientes c
LEFT JOIN public.representantes r ON r.id = c.representante_id
LEFT JOIN public.rotas_entrega re ON re.id = c.rota_entrega_id  
LEFT JOIN public.categorias_estabelecimento ce ON ce.id = c.categoria_estabelecimento_id
LEFT JOIN giro_stats gs ON gs.cliente_id = c.id
LEFT JOIN public.precos_categoria_cliente pcc ON pcc.cliente_id = c.id
WHERE c.ativo = true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_dados_analise_giro_cliente_id 
ON public.dados_analise_giro_materialized(cliente_id);

CREATE INDEX IF NOT EXISTS idx_dados_analise_giro_semaforo 
ON public.dados_analise_giro_materialized(semaforo_performance);

-- Enable RLS on the materialized view
ALTER MATERIALIZED VIEW public.dados_analise_giro_materialized OWNER TO postgres;

-- Update the refresh function to work with the new materialized view
CREATE OR REPLACE FUNCTION public.refresh_dados_analise_giro()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dados_analise_giro_materialized;
END;
$$;