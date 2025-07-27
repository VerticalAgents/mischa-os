
-- Fix security definer functions by setting proper search paths
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ultima_entrada_insumo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo = 'entrada' THEN
    UPDATE public.insumos 
    SET ultima_entrada = NEW.data_movimentacao 
    WHERE id = NEW.insumo_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_dados_analise_giro()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dados_analise_giro_materialized;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_role(user_id uuid, required_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION public.populate_historico_giro_semanal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'ROLE_ASSIGNED', 'user_roles', NEW.id::text, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'ROLE_UPDATED', 'user_roles', NEW.id::text, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'ROLE_REMOVED', 'user_roles', OLD.id::text, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip audit logging for audit_logs table itself to prevent recursion
  IF TG_TABLE_NAME = 'audit_logs' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, NEW.id::text, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, NEW.id::text, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, OLD.id::text, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_agendamentos_clientes_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_configuracoes_sistema_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_cliente_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se status_cliente mudou para Ativo, garantir que ativo = true
  IF NEW.status_cliente = 'Ativo' AND OLD.status_cliente != 'Ativo' THEN
    NEW.ativo = true;
  END IF;
  
  -- Se status_cliente mudou para Inativo, garantir que ativo = false
  IF NEW.status_cliente = 'Inativo' AND OLD.status_cliente != 'Inativo' THEN
    NEW.ativo = false;
  END IF;
  
  -- Se ativo mudou para false, garantir que status_cliente não seja Ativo
  IF NEW.ativo = false AND OLD.ativo = true AND NEW.status_cliente = 'Ativo' THEN
    NEW.status_cliente = 'Inativo';
  END IF;
  
  -- Se ativo mudou para true, garantir que status_cliente não seja Inativo
  IF NEW.ativo = true AND OLD.ativo = false AND NEW.status_cliente = 'Inativo' THEN
    NEW.status_cliente = 'Ativo';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip_address inet, 
  p_email text DEFAULT NULL::text, 
  p_attempt_type text DEFAULT 'login'::text, 
  p_time_window interval DEFAULT '00:15:00'::interval, 
  p_max_attempts integer DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- Fix overly permissive RLS policies
-- Update clientes table to require user authentication and proper isolation
DROP POLICY IF EXISTS "Authenticated users can manage clientes" ON public.clientes;
CREATE POLICY "Authenticated users can manage clientes" ON public.clientes
FOR ALL USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update configuracoes_sistema to require admin access for sensitive operations
DROP POLICY IF EXISTS "Permitir atualização de configurações" ON public.configuracoes_sistema;
CREATE POLICY "Permitir atualização de configurações" ON public.configuracoes_sistema
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND 
  (modulo NOT IN ('security', 'admin') OR has_role(auth.uid(), 'admin'::app_role))
);

DROP POLICY IF EXISTS "Permitir inserção de configurações" ON public.configuracoes_sistema;
CREATE POLICY "Permitir inserção de configurações" ON public.configuracoes_sistema
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND 
  (modulo NOT IN ('security', 'admin') OR has_role(auth.uid(), 'admin'::app_role))
);

-- Restrict access to dados_analise_giro_consolidados
ALTER TABLE public.dados_analise_giro_consolidados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read dados_analise_giro_consolidados" ON public.dados_analise_giro_consolidados
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add input validation functions
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Password must be at least 8 characters
  IF length(password) < 8 THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain at least one uppercase letter
  IF password !~ '[A-Z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain at least one lowercase letter
  IF password !~ '[a-z]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain at least one number
  IF password !~ '[0-9]' THEN
    RETURN FALSE;
  END IF;
  
  -- Must contain at least one special character
  IF password !~ '[!@#$%^&*(),.?":{}|<>]' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sanitize_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove potentially dangerous characters
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '[<>]', '', 'g'),
      'javascript:', '', 'gi'
    ),
    'onload=|onerror=|onclick=|onmouseover=', '', 'gi'
  );
END;
$$;

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_severity text DEFAULT 'INFO',
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values,
    created_at
  )
  VALUES (
    auth.uid(),
    'SECURITY_EVENT',
    'security_events',
    gen_random_uuid()::text,
    jsonb_build_object(
      'event_type', p_event_type,
      'severity', p_severity,
      'details', p_details,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    now()
  );
END;
$$;
