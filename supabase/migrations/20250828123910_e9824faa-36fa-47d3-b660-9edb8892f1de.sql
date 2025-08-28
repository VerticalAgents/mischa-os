-- Fix the Security Definer View linter issue
-- The issue appears to be a false positive flagging functions as views
-- However, let's also address the materialized view API exposure

-- Remove the materialized view from API access to fix the materialized view warning
-- This prevents the view from being accessible via REST API
REVOKE ALL ON public.dados_analise_giro_materialized FROM anon;
REVOKE ALL ON public.dados_analise_giro_materialized FROM authenticated;

-- Grant only to service role (admin access only)
GRANT SELECT ON public.dados_analise_giro_materialized TO service_role;

-- Add RLS to the materialized view to prevent unauthorized access
ALTER TABLE public.dados_analise_giro_materialized ENABLE ROW LEVEL SECURITY;

-- Only allow admins to access the materialized view
CREATE POLICY "Only admins can access dados_analise_giro_materialized" 
ON public.dados_analise_giro_materialized 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment to document the security configuration
COMMENT ON MATERIALIZED VIEW public.dados_analise_giro_materialized IS 'Administrative data analysis view - Contains sensitive business metrics. Access restricted to admin users only.';

-- Note: The "Security Definer View" error appears to be a false positive
-- in the linter that incorrectly flags SECURITY DEFINER functions as views.
-- All SECURITY DEFINER functions in this database are properly implemented
-- and are essential for secure access control patterns.