-- Fix security warnings by adding RLS policies for the materialized view
-- Enable RLS on the materialized view
ALTER TABLE public.dados_analise_giro_materialized ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for authenticated users to read the materialized view
CREATE POLICY "Authenticated users can read dados_analise_giro_materialized"
ON public.dados_analise_giro_materialized
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create policy for admins to refresh/manage the view
CREATE POLICY "Only admins can access dados_analise_giro_materialized for management"
ON public.dados_analise_giro_materialized
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));