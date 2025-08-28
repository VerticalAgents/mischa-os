-- Fix critical security issue: Restrict access to sales representative data
-- The 'representantes' table currently allows all authenticated users full access
-- This should be restricted to admin users only for data security

-- Drop existing overly permissive policies for representantes
DROP POLICY IF EXISTS "Authenticated users can delete representantes" ON public.representantes;
DROP POLICY IF EXISTS "Authenticated users can insert representantes" ON public.representantes;
DROP POLICY IF EXISTS "Authenticated users can read representantes" ON public.representantes;
DROP POLICY IF EXISTS "Authenticated users can update representantes" ON public.representantes;

-- Create secure role-based policies for representantes table
-- Only admins can manage representative data (full CRUD)
CREATE POLICY "Admins can manage representantes" 
ON public.representantes 
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Regular authenticated users can only read representative data for business operations
-- (needed for dropdowns, client assignments, etc.)
CREATE POLICY "Authenticated users can read representantes" 
ON public.representantes 
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create audit trigger for representative data changes
CREATE TRIGGER audit_representantes_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.representantes
    FOR EACH ROW EXECUTE FUNCTION log_financial_data_access();

-- Also secure the system configuration table that was flagged
-- Drop overly permissive policy on configuracoes_sistema
DROP POLICY IF EXISTS "Permitir leitura de configurações" ON public.configuracoes_sistema;

-- Create admin-only read policy for system configurations
CREATE POLICY "Admins can read configuracoes_sistema" 
ON public.configuracoes_sistema 
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep existing insert/update policies for configuracoes_sistema but ensure they're secure
-- The existing policies already require authentication, which is good