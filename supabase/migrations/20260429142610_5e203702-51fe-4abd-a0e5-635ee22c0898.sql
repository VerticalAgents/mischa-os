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
SET search_path TO 'public'
AS $function$
DECLARE
  email_attempts INTEGER := 0;
  ip_attempts INTEGER := 0;
  v_ip_max_attempts INTEGER := 30; -- limite mais alto para IP, evita travar usuarios diferentes
BEGIN
  -- Contagem por email (se informado): max p_max_attempts em p_time_window
  IF p_email IS NOT NULL THEN
    SELECT COUNT(*) INTO email_attempts
    FROM auth_attempts
    WHERE email = p_email
      AND attempt_type = p_attempt_type
      AND success = FALSE
      AND created_at > NOW() - p_time_window;

    IF email_attempts >= p_max_attempts THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Contagem por IP: limite muito mais alto, e ignora 127.0.0.1 (proxy interno do app)
  IF p_ip_address IS NOT NULL AND p_ip_address <> '127.0.0.1'::inet THEN
    SELECT COUNT(*) INTO ip_attempts
    FROM auth_attempts
    WHERE ip_address = p_ip_address
      AND attempt_type = p_attempt_type
      AND success = FALSE
      AND created_at > NOW() - p_time_window;

    IF ip_attempts >= v_ip_max_attempts THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$function$;