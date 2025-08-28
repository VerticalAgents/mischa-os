-- Fix Security Definer View issue by creating proper access control for materialized view
-- Materialized views cannot have RLS policies, so we need a different approach

-- Remove the failed policy attempt
-- (The previous command failed because materialized views don't support RLS)

-- Create a secure function to access the materialized view data
CREATE OR REPLACE FUNCTION public.get_dados_analise_giro()
RETURNS SETOF dados_analise_giro_materialized
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Only allow admins to access this sensitive business data
  SELECT * FROM public.dados_analise_giro_materialized
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;

-- Grant execute permission to authenticated users (RLS will be enforced inside the function)
GRANT EXECUTE ON FUNCTION public.get_dados_analise_giro() TO authenticated;

-- Revoke direct access to the materialized view from all users except postgres
REVOKE ALL ON public.dados_analise_giro_materialized FROM public, anon, authenticated;

-- Add a comment explaining the security model
COMMENT ON MATERIALIZED VIEW public.dados_analise_giro_materialized IS 'Sensitive business analytics data. Access restricted through get_dados_analise_giro() function with admin-only permissions.';

-- The materialized view is now only accessible through the secure function
-- which enforces admin-only access through the has_role() check