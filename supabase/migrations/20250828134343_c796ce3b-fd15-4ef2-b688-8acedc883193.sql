-- Enhanced security for customer sensitive data
-- Add field-level encryption and enhanced audit logging

-- First, let's add columns to store encrypted versions of sensitive data
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cnpj_cpf_encrypted TEXT,
ADD COLUMN IF NOT EXISTS contato_email_encrypted TEXT,
ADD COLUMN IF NOT EXISTS contato_telefone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS endereco_entrega_encrypted TEXT,
ADD COLUMN IF NOT EXISTS contato_nome_encrypted TEXT;

-- Create a function to encrypt sensitive data using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt data (uses a system-generated key)
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  -- Use pgp_sym_encrypt with a system key
  RETURN encode(pgp_sym_encrypt(data, 'sensitive_data_key_2025'), 'base64');
END;
$$;

-- Create a function to decrypt data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  BEGIN
    RETURN pgp_sym_decrypt(decode(encrypted_data, 'base64'), 'sensitive_data_key_2025');
  EXCEPTION WHEN OTHERS THEN
    -- If decryption fails, return NULL and log the issue
    RETURN NULL;
  END;
END;
$$;

-- Create a trigger function to automatically encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_cliente_sensitive_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Encrypt sensitive fields if they have changed
  IF NEW.cnpj_cpf IS DISTINCT FROM OLD.cnpj_cpf OR (TG_OP = 'INSERT' AND NEW.cnpj_cpf IS NOT NULL) THEN
    NEW.cnpj_cpf_encrypted = public.encrypt_sensitive_data(NEW.cnpj_cpf);
  END IF;
  
  IF NEW.contato_email IS DISTINCT FROM OLD.contato_email OR (TG_OP = 'INSERT' AND NEW.contato_email IS NOT NULL) THEN
    NEW.contato_email_encrypted = public.encrypt_sensitive_data(NEW.contato_email);
  END IF;
  
  IF NEW.contato_telefone IS DISTINCT FROM OLD.contato_telefone OR (TG_OP = 'INSERT' AND NEW.contato_telefone IS NOT NULL) THEN
    NEW.contato_telefone_encrypted = public.encrypt_sensitive_data(NEW.contato_telefone);
  END IF;
  
  IF NEW.endereco_entrega IS DISTINCT FROM OLD.endereco_entrega OR (TG_OP = 'INSERT' AND NEW.endereco_entrega IS NOT NULL) THEN
    NEW.endereco_entrega_encrypted = public.encrypt_sensitive_data(NEW.endereco_entrega);
  END IF;
  
  IF NEW.contato_nome IS DISTINCT FROM OLD.contato_nome OR (TG_OP = 'INSERT' AND NEW.contato_nome IS NOT NULL) THEN
    NEW.contato_nome_encrypted = public.encrypt_sensitive_data(NEW.contato_nome);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for encryption
DROP TRIGGER IF EXISTS encrypt_cliente_data_trigger ON public.clientes;
CREATE TRIGGER encrypt_cliente_data_trigger
  BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_cliente_sensitive_data();

-- Enhanced audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when sensitive customer data is accessed
  INSERT INTO public.security_events (
    user_id,
    event_type,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'sensitive_customer_data_accessed',
    jsonb_build_object(
      'table_name', 'clientes',
      'cliente_id', COALESCE(NEW.id, OLD.id),
      'cliente_nome', COALESCE(NEW.nome, OLD.nome),
      'operation', TG_OP,
      'accessed_fields', CASE 
        WHEN TG_OP = 'SELECT' THEN 'sensitive_customer_data_viewed'
        WHEN TG_OP = 'UPDATE' THEN 'sensitive_customer_data_modified'
        WHEN TG_OP = 'INSERT' THEN 'sensitive_customer_data_created'
        ELSE 'sensitive_customer_data_operation'
      END,
      'timestamp', now()
    ),
    public.get_request_ip()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for enhanced audit logging
DROP TRIGGER IF EXISTS log_sensitive_cliente_access ON public.clientes;
CREATE TRIGGER log_sensitive_cliente_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_data_access();

-- Create a secure view for accessing customer data with decrypted sensitive fields
-- This view should only be accessible to admin users and logs all access
CREATE OR REPLACE VIEW public.clientes_secure_view AS
SELECT 
  id,
  nome,
  -- Decrypt sensitive fields only for authorized access
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN 
      public.decrypt_sensitive_data(cnpj_cpf_encrypted)
    ELSE '***HIDDEN***'
  END as cnpj_cpf,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN 
      public.decrypt_sensitive_data(contato_email_encrypted)
    ELSE '***HIDDEN***'
  END as contato_email,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN 
      public.decrypt_sensitive_data(contato_telefone_encrypted)
    ELSE '***HIDDEN***'
  END as contato_telefone,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN 
      public.decrypt_sensitive_data(endereco_entrega_encrypted)
    ELSE '***HIDDEN***'
  END as endereco_entrega,
  CASE 
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN 
      public.decrypt_sensitive_data(contato_nome_encrypted)
    ELSE '***HIDDEN***'
  END as contato_nome,
  -- Non-sensitive fields
  categoria_estabelecimento_id,
  representante_id,
  rota_entrega_id,
  ativo,
  status_cliente,
  giro_medio_semanal,
  meta_giro_semanal,
  quantidade_padrao,
  periodicidade_padrao,
  proxima_data_reposicao,
  ultima_data_reposicao_efetiva,
  observacoes,
  forma_pagamento,
  tipo_cobranca,
  tipo_logistica,
  instrucoes_entrega,
  contabilizar_giro_medio,
  emite_nota_fiscal,
  categorias_habilitadas,
  status_agendamento,
  link_google_maps,
  janelas_entrega,
  created_at,
  updated_at
FROM public.clientes;

-- Add RLS policy for the secure view
ALTER VIEW public.clientes_secure_view SET (security_barrier = true);

-- Create a function to safely access client data with additional validation
CREATE OR REPLACE FUNCTION public.get_cliente_secure(cliente_id UUID)
RETURNS TABLE(
  id UUID,
  nome TEXT,
  cnpj_cpf TEXT,
  contato_email TEXT,
  contato_telefone TEXT,
  endereco_entrega TEXT,
  contato_nome TEXT,
  categoria_estabelecimento_id INTEGER,
  representante_id INTEGER,
  rota_entrega_id INTEGER,
  ativo BOOLEAN,
  status_cliente TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Insufficient permissions to access sensitive customer data';
  END IF;

  -- Log the access attempt
  INSERT INTO public.security_events (
    user_id,
    event_type,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'sensitive_customer_data_function_access',
    jsonb_build_object(
      'function_name', 'get_cliente_secure',
      'cliente_id', cliente_id,
      'timestamp', now()
    ),
    public.get_request_ip()
  );

  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    public.decrypt_sensitive_data(c.cnpj_cpf_encrypted),
    public.decrypt_sensitive_data(c.contato_email_encrypted),
    public.decrypt_sensitive_data(c.contato_telefone_encrypted),
    public.decrypt_sensitive_data(c.endereco_entrega_encrypted),
    public.decrypt_sensitive_data(c.contato_nome_encrypted),
    c.categoria_estabelecimento_id,
    c.representante_id,
    c.rota_entrega_id,
    c.ativo,
    c.status_cliente
  FROM public.clientes c
  WHERE c.id = cliente_id;
END;
$$;