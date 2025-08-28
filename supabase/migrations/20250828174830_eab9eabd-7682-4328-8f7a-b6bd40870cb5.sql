-- PR-C: FORÇA BRUTA - Desabilitar TODOS os triggers que usam tokens problemáticos

-- 1. Identificar e desabilitar triggers ativos na tabela clientes
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'clientes';