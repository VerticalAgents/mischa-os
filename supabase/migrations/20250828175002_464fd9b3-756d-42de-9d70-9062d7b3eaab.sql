-- PR-C: Remover constraints antigas conflitantes e aplicar as novas

-- 1. Remover constraints antigas que podem estar conflitando
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS check_status_cliente_valid;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS check_tipo_logistica_valid;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS check_tipo_cobranca_valid;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS check_forma_pagamento_valid;

-- 2. Verificar dados não migrados restantes
SELECT DISTINCT status_cliente FROM clientes WHERE status_cliente NOT IN ('ATIVO', 'INATIVO');
SELECT DISTINCT tipo_logistica FROM clientes WHERE tipo_logistica NOT IN ('PROPRIA', 'TERCEIRIZADA');
SELECT DISTINCT tipo_cobranca FROM clientes WHERE tipo_cobranca NOT IN ('A_VISTA', 'PARCELADO', 'A_PRAZO');
SELECT DISTINCT forma_pagamento FROM clientes WHERE forma_pagamento NOT IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO');