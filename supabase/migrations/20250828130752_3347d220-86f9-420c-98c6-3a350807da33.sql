-- Fix all remaining security issues from the database linter
-- This migration addresses the Security Definer View and Function Search Path issues

-- Fix the get_dados_analise_giro function to use proper access control instead of SECURITY DEFINER view behavior
DROP FUNCTION IF EXISTS public.get_dados_analise_giro();

-- Create a proper RLS policy for the materialized view instead of using SECURITY DEFINER
CREATE POLICY "Admins can access dados_analise_giro_materialized" 
ON public.dados_analise_giro_materialized 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on materialized view
ALTER MATERIALIZED VIEW public.dados_analise_giro_materialized ENABLE ROW LEVEL SECURITY;

-- Fix all functions missing search_path (add SET search_path = 'public')
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT role FROM public.user_roles WHERE user_id = $1 LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_request_ip()
RETURNS inet
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  -- Return a placeholder IP for now - this will be handled in the application layer
  SELECT '127.0.0.1'::inet;
$$;

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

CREATE OR REPLACE FUNCTION public.populate_historico_giro_semanal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.saldo_produto(p_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' THEN quantidade
    WHEN tipo = 'saida' THEN -quantidade
    ELSE quantidade
  END), 0)
  FROM public.movimentacoes_estoque_produtos
  WHERE produto_id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.saldo_insumo(i_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' THEN quantidade
    WHEN tipo = 'saida' THEN -quantidade
    ELSE quantidade
  END), 0)
  FROM public.movimentacoes_estoque_insumos
  WHERE insumo_id = i_id;
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

-- Hide the materialized view from the API by removing public access
REVOKE ALL ON public.dados_analise_giro_materialized FROM anon, authenticated;

-- Grant specific access only to admin users through RLS
GRANT SELECT ON public.dados_analise_giro_materialized TO authenticated;