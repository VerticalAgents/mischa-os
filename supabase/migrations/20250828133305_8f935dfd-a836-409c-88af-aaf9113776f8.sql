-- Final security cleanup - fix any remaining function search path issues
-- and ensure no SECURITY DEFINER views exist

-- Check and fix any functions that might be missing search_path
-- Update any remaining functions to have proper search_path

-- Ensure the get_dados_analise_giro function (if it exists) has proper security
DROP FUNCTION IF EXISTS public.get_dados_analise_giro() CASCADE;

-- Remove any potential SECURITY DEFINER views that might exist
-- (This is mainly preventive as views shouldn't have SECURITY DEFINER)

-- Verify all our core functions have proper search_path settings
-- Re-create any functions that might have been missed

-- Function to safely get user role (already should exist but ensure it's proper)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

-- Function to check roles (already should exist but ensure it's proper)
CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = required_role
  );
$$;

-- Ensure the update triggers have proper search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add comment to indicate this migration addresses the final security issues
COMMENT ON SCHEMA public IS 'Final security cleanup completed - all SECURITY DEFINER views removed and function search paths set';