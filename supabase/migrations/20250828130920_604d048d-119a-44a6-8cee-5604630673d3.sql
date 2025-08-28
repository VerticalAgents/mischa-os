-- Fix security issues properly: remove SECURITY DEFINER function and update search paths
-- This addresses both Security Definer View and Function Search Path Mutable warnings

-- Remove the problematic SECURITY DEFINER function that was mimicking a view
DROP FUNCTION IF EXISTS public.get_dados_analise_giro();

-- Fix all functions missing search_path to address Function Search Path Mutable warnings
CREATE OR REPLACE FUNCTION public.update_historico_producao_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_ultima_entrada_insumo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.sync_estoque_produto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.produto_id IS DISTINCT FROM OLD.produto_id) THEN
    UPDATE public.produtos_finais
      SET estoque_atual = public.saldo_produto(OLD.produto_id)
      WHERE id = OLD.produto_id;
  END IF;
  
  UPDATE public.produtos_finais
    SET estoque_atual = public.saldo_produto(COALESCE(NEW.produto_id, OLD.produto_id))
    WHERE id = COALESCE(NEW.produto_id, OLD.produto_id);
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_negative_produto()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE saldo_atual numeric;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo = 'saida' THEN
    saldo_atual := public.saldo_produto(NEW.produto_id);
    IF saldo_atual < NEW.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente (produto). Disponível: %, Tentado: %', saldo_atual, NEW.quantidade;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_estoque_insumo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.insumo_id IS DISTINCT FROM OLD.insumo_id) THEN
    UPDATE public.insumos
      SET estoque_atual = public.saldo_insumo(OLD.insumo_id)
      WHERE id = OLD.insumo_id;
  END IF;
  
  UPDATE public.insumos
    SET estoque_atual = public.saldo_insumo(COALESCE(NEW.insumo_id, OLD.insumo_id))
    WHERE id = COALESCE(NEW.insumo_id, OLD.insumo_id);
  
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_negative_insumo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE saldo_atual numeric;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo = 'saida' THEN
    saldo_atual := public.saldo_insumo(NEW.insumo_id);
    IF saldo_atual < NEW.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente (insumo). Disponível: %, Tentado: %', saldo_atual, NEW.quantidade;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_role_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.validate_email(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_cnpj_cpf(doc text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = 'public'
AS $$
BEGIN
  -- Remove non-numeric characters
  doc := regexp_replace(doc, '[^0-9]', '', 'g');
  
  -- Check if it's valid CNPJ (14 digits) or CPF (11 digits)
  RETURN (length(doc) = 14 OR length(doc) = 11) AND doc ~ '^[0-9]+$';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip_address inet, p_email text DEFAULT NULL::text, p_attempt_type text DEFAULT 'login'::text, p_time_window interval DEFAULT '00:15:00'::interval, p_max_attempts integer DEFAULT 5)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.sync_cliente_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Address the Materialized View in API warning by properly managing access
-- Since we can't use RLS on materialized views, we remove public access entirely
REVOKE ALL ON public.dados_analise_giro_materialized FROM public, anon, authenticated;

-- Only grant access to the postgres role (admin level)
GRANT SELECT ON public.dados_analise_giro_materialized TO postgres;

-- Add security comment explaining the access model
COMMENT ON MATERIALIZED VIEW public.dados_analise_giro_materialized IS 
'Sensitive business analytics view - Access restricted to admin users only. Data access is controlled at the application layer through admin role verification.';

-- The refresh function already has proper security controls
-- Users should access this data through application-level functions that verify admin roles