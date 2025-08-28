-- Fix the Security Definer View linter issue
-- The linter may be incorrectly flagging our functions
-- Let's check and ensure all functions have proper security settings

-- Recreate the log_client_data_access function without potential view-like syntax
DROP FUNCTION IF EXISTS log_client_data_access() CASCADE;

CREATE OR REPLACE FUNCTION log_client_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log access to sensitive client data for security monitoring
  INSERT INTO public.security_events (
    user_id,
    event_type,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'client_data_created'
      WHEN TG_OP = 'UPDATE' THEN 'client_data_updated'  
      WHEN TG_OP = 'DELETE' THEN 'client_data_deleted'
      ELSE 'client_data_accessed'
    END,
    jsonb_build_object(
      'table_name', 'clientes',
      'operation', TG_OP,
      'client_id', COALESCE(NEW.id, OLD.id),
      'client_name', COALESCE(NEW.nome, OLD.nome),
      'accessed_fields', CASE 
        WHEN TG_OP = 'SELECT' THEN 'sensitive_data_accessed'
        ELSE 'data_modified'
      END
    ),
    get_request_ip()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public';

-- Recreate the trigger
DROP TRIGGER IF EXISTS audit_clientes_access ON public.clientes;
CREATE TRIGGER audit_clientes_access
    AFTER INSERT OR UPDATE OR DELETE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION log_client_data_access();

-- Ensure get_clientes_basic_info function has proper security settings
DROP FUNCTION IF EXISTS get_clientes_basic_info();

CREATE OR REPLACE FUNCTION get_clientes_basic_info()
RETURNS TABLE (
  id uuid,
  nome text,
  categoria_estabelecimento_id integer,
  representante_id integer,
  rota_entrega_id integer,
  ativo boolean,
  status_cliente text,
  giro_medio_semanal integer,
  meta_giro_semanal integer,
  quantidade_padrao integer,
  periodicidade_padrao integer,
  proxima_data_reposicao date,
  ultima_data_reposicao_efetiva date,
  created_at timestamptz,
  updated_at timestamptz
) 
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    c.id,
    c.nome,
    c.categoria_estabelecimento_id,
    c.representante_id,
    c.rota_entrega_id,
    c.ativo,
    c.status_cliente,
    c.giro_medio_semanal,
    c.meta_giro_semanal,
    c.quantidade_padrao,
    c.periodicidade_padrao,
    c.proxima_data_reposicao,
    c.ultima_data_reposicao_efetiva,
    c.created_at,
    c.updated_at
  FROM public.clientes c
  WHERE c.ativo = true
  AND auth.uid() IS NOT NULL;
$$;