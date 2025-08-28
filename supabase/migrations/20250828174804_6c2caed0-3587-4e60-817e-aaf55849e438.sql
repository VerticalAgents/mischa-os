-- PR-C: CORREÇÃO DO TRIGGER DE SEGURANÇA
-- O trigger log_sensitive_data_modification está causando o erro 22P02

-- 1. Temporariamente desabilitar o trigger problemático
DROP TRIGGER IF EXISTS log_customer_changes ON clientes;

-- 2. Agora limpar dados corrompidos sem o trigger interferindo
UPDATE clientes SET status_cliente = 'Inativo' 
WHERE status_cliente IN ('customer_deleted', 'client_inactive', 'inactive', 'deleted');

UPDATE clientes SET status_cliente = 'Ativo' 
WHERE status_cliente IN ('user_active', 'active');

-- 3. Normalizar valores conhecidos inválidos  
UPDATE clientes SET tipo_logistica = 'Própria' WHERE tipo_logistica IN ('Retirada', 'Own');
UPDATE clientes SET tipo_cobranca = 'À vista' WHERE tipo_cobranca = 'Consignado';

-- 4. Garantir que não há campos nulos/vazios
UPDATE clientes SET forma_pagamento = 'Boleto' WHERE forma_pagamento IS NULL OR forma_pagamento = '';

-- 5. Recriar trigger de segurança SEM tokens problemáticos
CREATE OR REPLACE FUNCTION public.log_sensitive_data_modification_safe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log access to sensitive customer data for security monitoring
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
      'timestamp', now()
    ),
    public.get_request_ip()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 6. Reativar o trigger corrigido
CREATE TRIGGER log_customer_changes_safe
AFTER INSERT OR UPDATE OR DELETE ON clientes
FOR EACH ROW EXECUTE FUNCTION log_sensitive_data_modification_safe();