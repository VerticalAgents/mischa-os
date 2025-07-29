
-- Fix security definer functions to include proper search_path
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = required_role
  );
$function$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip_address inet, p_email text DEFAULT NULL::text, p_attempt_type text DEFAULT 'login'::text, p_time_window interval DEFAULT '00:15:00'::interval, p_max_attempts integer DEFAULT 5)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count INTEGER;
BEGIN
  -- Count recent attempts from this IP
  SELECT COUNT(*) INTO attempt_count
  FROM auth_attempts
  WHERE ip_address = p_ip_address
    AND attempt_type = p_attempt_type
    AND success = FALSE
    AND created_at > NOW() - p_time_window;
  
  -- If email is provided, also check email-based attempts
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO attempt_count
    FROM auth_attempts
    WHERE (ip_address = p_ip_address OR email = p_email)
      AND attempt_type = p_attempt_type
      AND success = FALSE
      AND created_at > NOW() - p_time_window;
  END IF;
  
  RETURN attempt_count < p_max_attempts;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_dados_analise_giro()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW dados_analise_giro_materialized;
END;
$function$;

CREATE OR REPLACE FUNCTION public.populate_historico_giro_semanal()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO historico_giro_semanal_consolidado (cliente_id, semana, giro_semanal)
  SELECT 
    cliente_id,
    DATE_TRUNC('week', data)::date as semana,
    SUM(quantidade) as giro_semanal
  FROM historico_entregas
  WHERE data >= NOW() - INTERVAL '12 weeks'
  GROUP BY cliente_id, DATE_TRUNC('week', data)
  ON CONFLICT (cliente_id, semana) 
  DO UPDATE SET 
    giro_semanal = EXCLUDED.giro_semanal,
    created_at = NOW();
END;
$function$;

-- Strengthen RLS policies for clientes table - require proper user context
DROP POLICY IF EXISTS "Authenticated users can manage clientes" ON public.clientes;
CREATE POLICY "Authenticated users can manage clientes" 
ON public.clientes 
FOR ALL 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Strengthen RLS for configuracoes_sistema - admin only for sensitive modules
DROP POLICY IF EXISTS "Permitir atualização de configurações" ON public.configuracoes_sistema;
CREATE POLICY "Admin can update all configurations" 
ON public.configuracoes_sistema 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update basic configurations" 
ON public.configuracoes_sistema 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND 
  modulo NOT IN ('security', 'admin', 'system', 'roles')
);

DROP POLICY IF EXISTS "Permitir inserção de configurações" ON public.configuracoes_sistema;
CREATE POLICY "Admin can insert all configurations" 
ON public.configuracoes_sistema 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert basic configurations" 
ON public.configuracoes_sistema 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  modulo NOT IN ('security', 'admin', 'system', 'roles')
);

-- Add RLS to dados_analise_giro_consolidados
ALTER TABLE public.dados_analise_giro_consolidados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read dados_analise_giro_consolidados" 
ON public.dados_analise_giro_consolidados 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify dados_analise_giro_consolidados" 
ON public.dados_analise_giro_consolidados 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  severity text,
  details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, new_values)
  VALUES (
    auth.uid(),
    'SECURITY_EVENT',
    'security_events',
    jsonb_build_object(
      'event_type', event_type,
      'severity', severity,
      'details', details,
      'timestamp', now()
    )
  );
END;
$function$;

-- Create index for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_security_events 
ON audit_logs (action, created_at) 
WHERE action = 'SECURITY_EVENT';

CREATE INDEX IF NOT EXISTS idx_auth_attempts_security 
ON auth_attempts (ip_address, email, success, created_at);
