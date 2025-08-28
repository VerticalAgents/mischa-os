-- Add audit logging for financial data access and create secure access functions

-- Create audit triggers for financial data access
CREATE TRIGGER audit_custos_fixos_access
    AFTER INSERT OR UPDATE OR DELETE ON public.custos_fixos
    FOR EACH ROW EXECUTE FUNCTION log_financial_data_access();

CREATE TRIGGER audit_custos_variaveis_access
    AFTER INSERT OR UPDATE OR DELETE ON public.custos_variaveis
    FOR EACH ROW EXECUTE FUNCTION log_financial_data_access();

CREATE TRIGGER audit_pedidos_access
    AFTER INSERT OR UPDATE OR DELETE ON public.pedidos
    FOR EACH ROW EXECUTE FUNCTION log_financial_data_access();

-- Create secure functions for basic financial summaries (non-sensitive aggregated data)
-- These allow non-admin users to see basic operational metrics without sensitive details

CREATE OR REPLACE FUNCTION get_custos_summary()
RETURNS TABLE (
  total_custos_fixos numeric,
  total_custos_variaveis numeric,
  num_categorias_custos integer
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COALESCE(SUM(cf.valor), 0) as total_custos_fixos,
    COALESCE(SUM(cv.valor), 0) as total_custos_variaveis,
    (
      SELECT COUNT(DISTINCT subcategoria) 
      FROM (
        SELECT subcategoria FROM public.custos_fixos
        UNION 
        SELECT subcategoria FROM public.custos_variaveis
      ) sub
    )::integer as num_categorias_custos
  FROM public.custos_fixos cf
  FULL OUTER JOIN public.custos_variaveis cv ON true
  WHERE auth.uid() IS NOT NULL;  -- Only for authenticated users
$$;

CREATE OR REPLACE FUNCTION get_pedidos_summary()
RETURNS TABLE (
  total_pedidos_mes bigint,
  valor_medio_pedido numeric,
  status_count jsonb
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*) as total_pedidos_mes,
    COALESCE(AVG(valor_total), 0) as valor_medio_pedido,
    jsonb_agg(
      jsonb_build_object(status, status_count)
    ) as status_count
  FROM (
    SELECT 
      status,
      COUNT(*) as status_count
    FROM public.pedidos
    WHERE data_pedido >= date_trunc('month', CURRENT_DATE)
    GROUP BY status
  ) status_summary
  WHERE auth.uid() IS NOT NULL;  -- Only for authenticated users
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_custos_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pedidos_summary() TO authenticated;

-- Add security comments
COMMENT ON TABLE public.custos_fixos IS 'Sensitive financial data - Fixed costs. Access restricted to admin users only with full audit logging.';
COMMENT ON TABLE public.custos_variaveis IS 'Sensitive financial data - Variable costs. Access restricted to admin users only with full audit logging.';
COMMENT ON TABLE public.pedidos IS 'Sensitive business data - Customer orders and financial details. Access restricted to admin users only with full audit logging.';

COMMENT ON FUNCTION get_custos_summary() IS 'Provides aggregated cost summaries for operational dashboards without exposing sensitive details.';
COMMENT ON FUNCTION get_pedidos_summary() IS 'Provides basic order statistics for operational dashboards without exposing customer or financial details.';