-- Fix critical security issue: Restrict clientes table read access to admin users only
-- Drop the overly permissive policy that allows any authenticated user to read sensitive customer data
DROP POLICY IF EXISTS "Authenticated users can read clientes with audit" ON public.clientes;

-- Create a new restrictive policy that only allows admin users to read customer data
CREATE POLICY "Only admins can read clientes"
ON public.clientes 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ensure audit logging is still in place for admin access
-- The log_client_data_access trigger should already be handling this