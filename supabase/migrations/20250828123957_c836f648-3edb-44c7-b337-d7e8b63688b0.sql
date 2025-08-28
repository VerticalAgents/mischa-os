-- Fix materialized view API exposure (materialized views don't support RLS)
-- Instead, we'll remove API access and provide controlled access through a function

-- Remove the materialized view from API access completely
REVOKE ALL ON public.dados_analise_giro_materialized FROM anon;
REVOKE ALL ON public.dados_analise_giro_materialized FROM authenticated;

-- Grant only to service role for admin functions
GRANT SELECT ON public.dados_analise_giro_materialized TO service_role;

-- Create a secure function to access the materialized view data
CREATE OR REPLACE FUNCTION get_dados_analise_giro()
RETURNS SETOF public.dados_analise_giro_materialized
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Only allow admins to access this sensitive business data
  SELECT * FROM public.dados_analise_giro_materialized
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;

-- Grant execute permission only to authenticated users 
-- (function itself will check admin role)
GRANT EXECUTE ON FUNCTION get_dados_analise_giro() TO authenticated;

-- Add comment to document the security configuration
COMMENT ON MATERIALIZED VIEW public.dados_analise_giro_materialized IS 'Administrative data analysis view - Contains sensitive business metrics. Access only through get_dados_analise_giro() function for admin users.';
COMMENT ON FUNCTION get_dados_analise_giro() IS 'Secure access function for admin-only business analytics data from materialized view.';