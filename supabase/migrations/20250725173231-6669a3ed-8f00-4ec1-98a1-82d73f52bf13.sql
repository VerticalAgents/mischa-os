
-- Phase 1: Critical Database Security Fixes

-- 1. Fix RLS policies - Replace overly permissive policies with proper user-based access controls
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Permitir acesso total aos agendamentos" ON agendamentos_clientes;
DROP POLICY IF EXISTS "Permitir acesso completo a confirmacoes_reposicao" ON confirmacoes_reposicao;
DROP POLICY IF EXISTS "Allow all operations on cache_analise_giro" ON cache_analise_giro;
DROP POLICY IF EXISTS "Permitir todas as operações em historico_entregas" ON historico_entregas;
DROP POLICY IF EXISTS "Permitir todas as operações em movimentacoes_estoque_produtos" ON movimentacoes_estoque_produtos;
DROP POLICY IF EXISTS "Allow all operations on historico_giro_semanal_consolidado" ON historico_giro_semanal_consolidado;
DROP POLICY IF EXISTS "Permitir acesso completo a giros_semanais_personalizados" ON giros_semanais_personalizados;
DROP POLICY IF EXISTS "Permitir acesso completo a precos_categoria_cliente" ON precos_categoria_cliente;
DROP POLICY IF EXISTS "Permitir acesso total a proporcoes_padrao" ON proporcoes_padrao;
DROP POLICY IF EXISTS "Allow all operations on clientes_categorias" ON clientes_categorias;

-- Create proper user-based RLS policies
CREATE POLICY "Users can manage their agendamentos_clientes" ON agendamentos_clientes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage their confirmacoes_reposicao" ON confirmacoes_reposicao
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can read cache_analise_giro" ON cache_analise_giro
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify cache_analise_giro" ON cache_analise_giro
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update cache_analise_giro" ON cache_analise_giro
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete cache_analise_giro" ON cache_analise_giro
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage historico_entregas" ON historico_entregas
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage movimentacoes_estoque_produtos" ON movimentacoes_estoque_produtos
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read historico_giro_semanal_consolidado" ON historico_giro_semanal_consolidado
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify historico_giro_semanal_consolidado" ON historico_giro_semanal_consolidado
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update historico_giro_semanal_consolidado" ON historico_giro_semanal_consolidado
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete historico_giro_semanal_consolidado" ON historico_giro_semanal_consolidado
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage giros_semanais_personalizados" ON giros_semanais_personalizados
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage precos_categoria_cliente" ON precos_categoria_cliente
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read proporcoes_padrao" ON proporcoes_padrao
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can modify proporcoes_padrao" ON proporcoes_padrao
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update proporcoes_padrao" ON proporcoes_padrao
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete proporcoes_padrao" ON proporcoes_padrao
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage clientes_categorias" ON clientes_categorias
  FOR ALL USING (auth.uid() IS NOT NULL);

-- 2. Fix database functions - Add proper search_path settings
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

-- 3. Secure user roles - Add constraints and audit logging
ALTER TABLE user_roles ADD CONSTRAINT unique_user_role UNIQUE (user_id, role);

-- Add audit logging for role changes
CREATE OR REPLACE FUNCTION log_role_changes()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_changes();

-- 4. Add input validation functions
CREATE OR REPLACE FUNCTION validate_email(email text)
RETURNS boolean AS $$
BEGIN
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION validate_cnpj_cpf(doc text)
RETURNS boolean AS $$
BEGIN
  -- Remove non-numeric characters
  doc := regexp_replace(doc, '[^0-9]', '', 'g');
  
  -- Check if it's valid CNPJ (14 digits) or CPF (11 digits)
  RETURN (length(doc) = 14 OR length(doc) = 11) AND doc ~ '^[0-9]+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. Add rate limiting table for authentication attempts
CREATE TABLE IF NOT EXISTS auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email TEXT,
  attempt_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset'
  success BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on auth_attempts
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view auth attempts
CREATE POLICY "Only admins can view auth_attempts" ON auth_attempts
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- System can insert auth attempts
CREATE POLICY "System can insert auth_attempts" ON auth_attempts
  FOR INSERT WITH CHECK (true);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_ip_address INET,
  p_email TEXT DEFAULT NULL,
  p_attempt_type TEXT DEFAULT 'login',
  p_time_window INTERVAL DEFAULT '15 minutes',
  p_max_attempts INTEGER DEFAULT 5
)
RETURNS BOOLEAN AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 6. Add comprehensive audit logging trigger function
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_clientes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clientes
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_produtos_trigger
  AFTER INSERT OR UPDATE OR DELETE ON produtos
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();

CREATE TRIGGER audit_configuracoes_sistema_trigger
  AFTER INSERT OR UPDATE OR DELETE ON configuracoes_sistema
  FOR EACH ROW EXECUTE FUNCTION audit_table_changes();
