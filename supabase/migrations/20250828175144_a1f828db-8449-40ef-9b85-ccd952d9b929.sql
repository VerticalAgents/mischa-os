-- PR-C: Finalizar constraints restantes

-- 1. Aplicar demais constraints (status_cliente já funcionou)
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_logistica_canonical 
CHECK (tipo_logistica IN ('PROPRIA', 'TERCEIRIZADA'));

ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO'));

ALTER TABLE clientes 
ADD CONSTRAINT ck_forma_pagamento_canonical 
CHECK (forma_pagamento IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'));

-- 2. Configurar versioning para cache invalidation
INSERT INTO configuracoes_sistema (modulo, configuracoes) 
VALUES ('cache', '{"schemaVersion": "clientes.v3", "lastUpdate": "2025-08-28T17:45:00Z"}')
ON CONFLICT (modulo) DO UPDATE SET 
  configuracoes = EXCLUDED.configuracoes,
  updated_at = now();

-- 3. Criar índices para performance nas novas constraints
CREATE INDEX IF NOT EXISTS idx_clientes_status_canonical ON clientes(status_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_logistica_canonical ON clientes(tipo_logistica);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_cobranca_canonical ON clientes(tipo_cobranca);
CREATE INDEX IF NOT EXISTS idx_clientes_forma_pagamento_canonical ON clientes(forma_pagamento);