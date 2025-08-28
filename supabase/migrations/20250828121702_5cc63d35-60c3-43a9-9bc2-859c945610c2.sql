-- Fix critical security issue: Restrict access to financial data tables
-- Remove overly permissive policies and implement proper authentication-based access control

-- Drop existing permissive policies for custos_fixos
DROP POLICY IF EXISTS "Allow all operations on custos_fixos" ON public.custos_fixos;

-- Drop existing permissive policies for custos_variaveis  
DROP POLICY IF EXISTS "Allow all operations on custos_variaveis" ON public.custos_variaveis;

-- Create secure policies for custos_fixos - restrict to authenticated users only
CREATE POLICY "Authenticated users can read custos_fixos" 
ON public.custos_fixos 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert custos_fixos" 
ON public.custos_fixos 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update custos_fixos" 
ON public.custos_fixos 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete custos_fixos" 
ON public.custos_fixos 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create secure policies for custos_variaveis - restrict to authenticated users only
CREATE POLICY "Authenticated users can read custos_variaveis" 
ON public.custos_variaveis 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert custos_variaveis" 
ON public.custos_variaveis 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update custos_variaveis" 
ON public.custos_variaveis 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete custos_variaveis" 
ON public.custos_variaveis 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Add audit logging for financial data changes (security monitoring)
CREATE OR REPLACE FUNCTION log_financial_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to financial data for security monitoring
  INSERT INTO public.security_events (
    user_id,
    event_type,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'financial_data_created'
      WHEN TG_OP = 'UPDATE' THEN 'financial_data_updated'  
      WHEN TG_OP = 'DELETE' THEN 'financial_data_deleted'
      ELSE 'financial_data_accessed'
    END,
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id)
    ),
    get_request_ip()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;