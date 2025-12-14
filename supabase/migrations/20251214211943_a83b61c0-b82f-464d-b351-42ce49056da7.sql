-- Corrigir inconsistência: DAPROD UFRGS com ativo=false deve ter status_cliente='INATIVO'
UPDATE clientes 
SET status_cliente = 'INATIVO', updated_at = NOW() 
WHERE nome = 'DAPROD UFRGS' AND ativo = false AND status_cliente = 'ATIVO';