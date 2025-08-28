-- PR-C: Finalizar todas as constraints restantes

-- 1. Migrar tipos cobrança para canônicos
UPDATE clientes SET tipo_cobranca = 'A_VISTA' WHERE tipo_cobranca = 'À vista';
UPDATE clientes SET tipo_cobranca = 'PARCELADO' WHERE tipo_cobranca = 'Parcelado';
UPDATE clientes SET tipo_cobranca = 'A_PRAZO' WHERE tipo_cobranca = 'A prazo';
UPDATE clientes SET tipo_cobranca = 'A_VISTA' WHERE tipo_cobranca = 'Consignado';
UPDATE clientes SET tipo_cobranca = 'A_VISTA' 
WHERE tipo_cobranca IS NULL OR tipo_cobranca NOT IN ('A_VISTA', 'PARCELADO', 'A_PRAZO');

-- 2. Aplicar constraints das duas últimas
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO'));

ALTER TABLE clientes 
ADD CONSTRAINT ck_forma_pagamento_canonical 
CHECK (forma_pagamento IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'));

-- 3. Configurar cache versioning e índices
INSERT INTO configuracoes_sistema (modulo, configuracoes) 
VALUES ('cache', '{"schemaVersion": "clientes.v3", "lastUpdate": "2025-08-28T17:45:00Z"}')
ON CONFLICT (modulo) DO UPDATE SET 
  configuracoes = EXCLUDED.configuracoes,
  updated_at = now();

CREATE INDEX IF NOT EXISTS idx_clientes_status_canonical ON clientes(status_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_logistica_canonical ON clientes(tipo_logistica);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_cobranca_canonical ON clientes(tipo_cobranca);
CREATE INDEX IF NOT EXISTS idx_clientes_forma_pagamento_canonical ON clientes(forma_pagamento);