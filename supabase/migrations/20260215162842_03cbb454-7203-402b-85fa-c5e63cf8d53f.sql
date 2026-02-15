ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_logistica_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_cobranca_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_forma_pagamento_canonical;