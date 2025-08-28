-- Fix pgcrypto functions with correct search_path
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF data IS NULL OR data = '' THEN
    RETURN NULL;
  END IF;
  RETURN encode(extensions.pgp_sym_encrypt(data::text, 'sensitive_data_key_2025'::text), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  BEGIN
    RETURN convert_from(extensions.pgp_sym_decrypt(decode(encrypted_data, 'base64'), 'sensitive_data_key_2025'::text), 'utf8');
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$;