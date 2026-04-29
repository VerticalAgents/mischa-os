-- Empurra tentativas falhas recentes para fora da janela de 15 minutos
-- (mantemos os registros como auditoria, mas eles deixam de contar para o rate limit)
UPDATE public.auth_attempts
SET created_at = NOW() - INTERVAL '24 hours'
WHERE success = FALSE
  AND created_at > NOW() - INTERVAL '15 minutes';