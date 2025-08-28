-- Enhanced security for customer sensitive data (fixed version)
-- Add field-level encryption and enhanced audit logging

-- First, let's add columns to store encrypted versions of sensitive data
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cnpj_cpf_encrypted TEXT,
ADD COLUMN IF NOT EXISTS contato_email_encrypted TEXT,
ADD COLUMN IF NOT EXISTS contato_telefone_encrypted TEXT,
ADD COLUMN IF NOT EXISTS endereco_entrega_encrypted TEXT,
ADD COLUMN IF NOT EXISTS contato_nome_encrypted TEXT;

-- Create extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt sensitive data using pgcrypto
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
    -- If decryption fails, return NULL
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

-- Create the trigger for encryption (only on INSERT/UPDATE)
DROP TRIGGER IF EXISTS encrypt_cliente_data_trigger ON public.clientes;
CREATE TRIGGER encrypt_cliente_data_trigger
  BEFORE INSERT OR UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_cliente_sensitive_data();

-- Enhanced audit logging function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_sensitive_data_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log when sensitive customer data is modified
  INSERT INTO public.security_events (
    user_id,
    event_type,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'sensitive_customer_data_modified',
    jsonb_build_object(
      'table_name', 'clientes',
      'cliente_id', COALESCE(NEW.id, OLD.id),
      'cliente_nome', COALESCE(NEW.nome, OLD.nome),
      'operation', TG_OP,
      'timestamp', now(),
      'sensitive_fields_accessed', CASE 
        WHEN TG_OP = 'UPDATE' THEN jsonb_build_object(
          'cnpj_cpf_changed', (NEW.cnpj_cpf IS DISTINCT FROM OLD.cnpj_cpf),
          'email_changed', (NEW.contato_email IS DISTINCT FROM OLD.contato_email),
          'telefone_changed', (NEW.contato_telefone IS DISTINCT FROM OLD.contato_telefone),
          'endereco_changed', (NEW.endereco_entrega IS DISTINCT FROM OLD.endereco_entrega)
        )
        WHEN TG_OP = 'INSERT' THEN 'new_customer_created'
        ELSE 'customer_deleted'
      END
    ),
    public.get_request_ip()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for enhanced audit logging (only for modifications)
DROP TRIGGER IF EXISTS log_sensitive_cliente_modifications ON public.clientes;
CREATE TRIGGER log_sensitive_cliente_modifications
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.log_sensitive_data_modification();

-- Create a function to safely access client data with additional validation and logging
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
    COALESCE(public.decrypt_sensitive_data(c.cnpj_cpf_encrypted), c.cnpj_cpf),
    COALESCE(public.decrypt_sensitive_data(c.contato_email_encrypted), c.contato_email),
    COALESCE(public.decrypt_sensitive_data(c.contato_telefone_encrypted), c.contato_telefone),
    COALESCE(public.decrypt_sensitive_data(c.endereco_entrega_encrypted), c.endereco_entrega),
    COALESCE(public.decrypt_sensitive_data(c.contato_nome_encrypted), c.contato_nome),
    c.categoria_estabelecimento_id,
    c.representante_id,
    c.rota_entrega_id,
    c.ativo,
    c.status_cliente
  FROM public.clientes c
  WHERE c.id = cliente_id;
END;
$$;

-- Function to get multiple clients with encrypted data protection
CREATE OR REPLACE FUNCTION public.get_clientes_secure()
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
  status_cliente TEXT,
  giro_medio_semanal INTEGER,
  meta_giro_semanal INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow admin users to access this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Insufficient permissions to access customer data';
  END IF;

  -- Log the bulk access attempt
  INSERT INTO public.security_events (
    user_id,
    event_type,
    details,
    ip_address
  ) VALUES (
    auth.uid(),
    'bulk_customer_data_access',
    jsonb_build_object(
      'function_name', 'get_clientes_secure',
      'timestamp', now()
    ),
    public.get_request_ip()
  );

  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    COALESCE(public.decrypt_sensitive_data(c.cnpj_cpf_encrypted), c.cnpj_cpf),
    COALESCE(public.decrypt_sensitive_data(c.contato_email_encrypted), c.contato_email),
    COALESCE(public.decrypt_sensitive_data(c.contato_telefone_encrypted), c.contato_telefone),
    COALESCE(public.decrypt_sensitive_data(c.endereco_entrega_encrypted), c.endereco_entrega),
    COALESCE(public.decrypt_sensitive_data(c.contato_nome_encrypted), c.contato_nome),
    c.categoria_estabelecimento_id,
    c.representante_id,
    c.rota_entrega_id,
    c.ativo,
    c.status_cliente,
    c.giro_medio_semanal,
    c.meta_giro_semanal,
    c.created_at,
    c.updated_at
  FROM public.clientes c;
END;
$$;