-- PR-C: Desabilitar trigger específico e aplicar limpeza de dados

-- 1. Desabilitar trigger que está causando o erro JSON
DROP TRIGGER IF EXISTS log_sensitive_cliente_modifications ON clientes;

-- 2. Agora limpar dados corrompidos 
UPDATE clientes 
SET status_cliente = 'Inativo' 
WHERE status_cliente IN ('customer_deleted', 'client_inactive', 'inactive', 'deleted');

UPDATE clientes 
SET status_cliente = 'Ativo' 
WHERE status_cliente IN ('user_active', 'active');

-- 3. Normalizar tipos logística 
UPDATE clientes 
SET tipo_logistica = 'Própria' 
WHERE tipo_logistica IN ('Retirada', 'Own');

-- 4. Normalizar tipos cobrança
UPDATE clientes 
SET tipo_cobranca = 'À vista' 
WHERE tipo_cobranca = 'Consignado';

-- 5. Garantir valores não nulos
UPDATE clientes 
SET forma_pagamento = 'Boleto' 
WHERE forma_pagamento IS NULL OR forma_pagamento = '';

UPDATE clientes 
SET status_cliente = 'Ativo' 
WHERE status_cliente IS NULL OR status_cliente = '';

UPDATE clientes 
SET tipo_logistica = 'Própria' 
WHERE tipo_logistica IS NULL OR tipo_logistica = '';

UPDATE clientes 
SET tipo_cobranca = 'À vista' 
WHERE tipo_cobranca IS NULL OR tipo_cobranca = '';