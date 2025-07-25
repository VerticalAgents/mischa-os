
-- Fix security definer functions by adding proper search_path
-- This prevents privilege escalation attacks

-- Update the has_role function to be more secure
CREATE OR REPLACE FUNCTION public.has_role(user_id UUID, required_role app_role)
RETURNS BOOLEAN AS $$
BEGIN
  -- Set search_path to prevent privilege escalation
  SET search_path = public;
  
  -- Check if user has the required role
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = $1 AND user_roles.role = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update the get_user_role function to be more secure
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS app_role AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Set search_path to prevent privilege escalation
  SET search_path = public;
  
  -- Get user role, default to 'user' if not found
  SELECT role INTO user_role
  FROM public.user_roles 
  WHERE user_roles.user_id = $1;
  
  -- Return 'user' as default if no role found
  RETURN COALESCE(user_role, 'user'::app_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add a trigger to log authentication attempts for security monitoring
CREATE OR REPLACE FUNCTION public.log_auth_attempt()
RETURNS TRIGGER AS $$
BEGIN
  -- Set search_path to prevent privilege escalation
  SET search_path = public;
  
  -- Log failed authentication attempts
  INSERT INTO public.auth_attempts (
    ip_address, 
    email, 
    attempt_type, 
    success
  ) VALUES (
    COALESCE(current_setting('request.headers', true)::json->>'x-forwarded-for', '127.0.0.1')::inet,
    NEW.email,
    'login',
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add input validation function for CNPJs/CPFs
CREATE OR REPLACE FUNCTION public.validate_cnpj_cpf(document TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Set search_path to prevent privilege escalation
  SET search_path = public;
  
  -- Remove non-numeric characters
  document := regexp_replace(document, '[^0-9]', '', 'g');
  
  -- Check length (11 for CPF, 14 for CNPJ)
  IF length(document) NOT IN (11, 14) THEN
    RETURN FALSE;
  END IF;
  
  -- Check for repeated digits (invalid)
  IF document ~ '^(.)\1*$' THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER IMMUTABLE;

-- Add server-side IP logging function
CREATE OR REPLACE FUNCTION public.get_client_ip()
RETURNS INET AS $$
BEGIN
  -- Set search_path to prevent privilege escalation
  SET search_path = public;
  
  -- Get client IP from request headers
  RETURN COALESCE(
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'x-real-ip',
    '127.0.0.1'
  )::inet;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
