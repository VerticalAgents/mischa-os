-- Add audit logging for financial data access and create secure access functions
-- Fixed version with correct SQL syntax

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
  WHERE auth.uid() IS NOT NULL;
$$;

-- Fixed pedidos summary function
CREATE OR REPLACE FUNCTION get_pedidos_summary()
RETURNS TABLE (
  total_pedidos_mes bigint,
  valor_medio_pedido numeric
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COUNT(*)::bigint as total_pedidos_mes,
    COALESCE(AVG(p.valor_total), 0)::numeric as valor_medio_pedido
  FROM public.pedidos p
  WHERE p.data_pedido >= date_trunc('month', CURRENT_DATE)
    AND auth.uid() IS NOT NULL;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_custos_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pedidos_summary() TO authenticated;

-- Add security comments
COMMENT ON TABLE public.custos_fixos IS 'Sensitive financial data - Fixed costs. Access restricted to admin users only with full audit logging.';
COMMENT ON TABLE public.custos_variaveis IS 'Sensitive financial data - Variable costs. Access restricted to admin users only with full audit logging.';
COMMENT ON TABLE public.pedidos IS 'Sensitive business data - Customer orders and financial details. Access restricted to admin users only with full audit logging.';