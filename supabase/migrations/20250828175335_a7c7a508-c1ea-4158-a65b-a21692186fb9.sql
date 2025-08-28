-- PR-C: Finalizar completamente - última constraint e configurações

-- 1. Aplicar constraint de tipo_cobranca que foi perdida
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO'));

-- 2. Configurar cache versioning e índices
INSERT INTO configuracoes_sistema (modulo, configuracoes) 
VALUES ('cache', '{"schemaVersion": "clientes.v3", "lastUpdate": "2025-08-28T17:45:00Z"}')
ON CONFLICT (modulo) DO UPDATE SET 
  configuracoes = EXCLUDED.configuracoes,
  updated_at = now();

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_status_canonical ON clientes(status_cliente);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_logistica_canonical ON clientes(tipo_logistica);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo_cobranca_canonical ON clientes(tipo_cobranca);
CREATE INDEX IF NOT EXISTS idx_clientes_forma_pagamento_canonical ON clientes(forma_pagamento);

-- 4. Relatório final de migração
SELECT 
  'MIGRAÇÃO CONCLUÍDA' as status,
  COUNT(*) as total_clientes,
  COUNT(CASE WHEN status_cliente = 'ATIVO' THEN 1 END) as ativos,
  COUNT(CASE WHEN status_cliente = 'INATIVO' THEN 1 END) as inativos
FROM clientes;