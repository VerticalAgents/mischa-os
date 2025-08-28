-- Create materialized view for giro analysis
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dados_analise_giro_materialized AS
WITH cliente_stats AS (
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
    c.created_at,
    c.updated_at
  FROM public.clientes c
  LEFT JOIN public.representantes r ON r.id = c.representante_id
  LEFT JOIN public.rotas_entrega re ON re.id = c.rota_entrega_id
  LEFT JOIN public.categorias_estabelecimento ce ON ce.id = c.categoria_estabelecimento_id
),
giro_calculations AS (
  SELECT 
    cs.*,
    COALESCE(
      (
        SELECT SUM(he.quantidade)::numeric / 
        GREATEST(1, EXTRACT(EPOCH FROM (MAX(he.data) - MIN(he.data))) / (7 * 24 * 3600))
        FROM public.historico_entregas he 
        WHERE he.cliente_id = cs.cliente_id 
        AND he.data >= NOW() - INTERVAL '8 weeks'
        AND he.tipo = 'entrega'
      ), 0
    ) as giro_semanal_calculado,
    
    COALESCE(
      (
        SELECT AVG(he.quantidade)::numeric
        FROM public.historico_entregas he 
        WHERE he.cliente_id = cs.cliente_id 
        AND he.data >= NOW() - INTERVAL '12 weeks'
        AND he.tipo = 'entrega'
      ), 0
    ) as giro_medio_historico,
    
    COALESCE(
      (
        SELECT SUM(he.quantidade)::numeric
        FROM public.historico_entregas he 
        WHERE he.cliente_id = cs.cliente_id 
        AND he.data >= DATE_TRUNC('week', NOW())
        AND he.tipo = 'entrega'
      ), 0
    ) as giro_ultima_semana,
    
    COALESCE(
      (
        SELECT STDDEV(he.quantidade)::numeric
        FROM public.historico_entregas he 
        WHERE he.cliente_id = cs.cliente_id 
        AND he.data >= NOW() - INTERVAL '12 weeks'
        AND he.tipo = 'entrega'
      ), 0
    ) as desvio_padrao_giro
    
  FROM cliente_stats cs
),
final_calculations AS (
  SELECT 
    gc.*,
    CASE 
      WHEN gc.giro_medio_historico > 0 THEN
        ((gc.giro_semanal_calculado - gc.giro_medio_historico) / gc.giro_medio_historico * 100)::numeric
      ELSE 0
    END as variacao_percentual,
    
    CASE 
      WHEN gc.meta_giro_semanal > 0 THEN
        (gc.giro_semanal_calculado / gc.meta_giro_semanal * 100)::numeric
      ELSE 0
    END as achievement_meta,
    
    CASE 
      WHEN gc.meta_giro_semanal > 0 AND gc.giro_semanal_calculado >= gc.meta_giro_semanal THEN 'verde'
      WHEN gc.meta_giro_semanal > 0 AND gc.giro_semanal_calculado >= (gc.meta_giro_semanal * 0.8) THEN 'amarelo'
      ELSE 'vermelho'
    END::text as semaforo_performance,
    
    (gc.giro_semanal_calculado * COALESCE(
      (SELECT AVG(pcc.preco_unitario) FROM public.precos_categoria_cliente pcc WHERE pcc.cliente_id = gc.cliente_id),
      10.0
    ))::numeric as faturamento_semanal_previsto,
    
    NOW() as data_consolidacao
    
  FROM giro_calculations gc
)
SELECT * FROM final_calculations;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_dados_analise_giro_cliente_id ON public.dados_analise_giro_materialized(cliente_id);
CREATE INDEX IF NOT EXISTS idx_dados_analise_giro_representante ON public.dados_analise_giro_materialized(representante_nome);
CREATE INDEX IF NOT EXISTS idx_dados_analise_giro_semaforo ON public.dados_analise_giro_materialized(semaforo_performance);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_dados_analise_giro()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW dados_analise_giro_materialized;
END;
$function$;

-- Refresh the view with current data
REFRESH MATERIALIZED VIEW public.dados_analise_giro_materialized;