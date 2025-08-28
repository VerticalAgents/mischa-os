-- PR-C: Finalizar correção de tipo_cobranca

-- 1. Migrar todos os tipos_cobranca restantes
UPDATE clientes SET tipo_cobranca = 'A_VISTA' WHERE tipo_cobranca = 'À vista';
UPDATE clientes SET tipo_cobranca = 'A_VISTA' WHERE tipo_cobranca = 'Consignado';

-- 2. Aplicar constraint
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO'));

-- 3. Configurações finais
INSERT INTO configuracoes_sistema (modulo, configuracoes) 
VALUES ('cache', '{"schemaVersion": "clientes.v3", "lastUpdate": "2025-08-28T17:45:00Z"}')
ON CONFLICT (modulo) DO UPDATE SET 
  configuracoes = EXCLUDED.configuracoes,
  updated_at = now();