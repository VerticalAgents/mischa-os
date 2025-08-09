
-- ligar automação real
INSERT INTO public.app_feature_flags (key, enabled)
VALUES ('auto_baixa_entrega', true)
ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now();

-- manter shadow ligado para telemetria (opcional, recomendado)
INSERT INTO public.app_feature_flags (key, enabled)
VALUES ('auto_baixa_entrega_shadow', true)
ON CONFLICT (key) DO UPDATE SET enabled = EXCLUDED.enabled, updated_at = now();
