-- PR-C: Finalizar migração com constraints corretas

-- 1. Completar migração dos dados restantes
UPDATE clientes SET forma_pagamento = 'BOLETO' WHERE forma_pagamento = 'Boleto';
UPDATE clientes SET forma_pagamento = 'DINHEIRO' WHERE forma_pagamento = 'Dinheiro';

-- 2. Aplicar constraints finais (agora deve funcionar)
ALTER TABLE clientes 
ADD CONSTRAINT ck_status_cliente_canonical 
CHECK (status_cliente IN ('ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY'));

ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_logistica_canonical 
CHECK (tipo_logistica IN ('PROPRIA', 'TERCEIRIZADA'));

ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO'));

ALTER TABLE clientes 
ADD CONSTRAINT ck_forma_pagamento_canonical 
CHECK (forma_pagamento IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'));

-- 3. Configurar versioning para cache invalidation
INSERT INTO configuracoes_sistema (modulo, configuracoes) 
VALUES ('cache', '{"schemaVersion": "clientes.v3", "lastUpdate": "2025-08-28T17:45:00Z"}')
ON CONFLICT (modulo) DO UPDATE SET 
  configuracoes = EXCLUDED.configuracoes,
  updated_at = now();