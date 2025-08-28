-- PR-C: Corrigir dados de logística primeiro

-- 1. Migrar todos os tipos logística para canônicos
UPDATE clientes SET tipo_logistica = 'PROPRIA' WHERE tipo_logistica = 'Própria';
UPDATE clientes SET tipo_logistica = 'TERCEIRIZADA' WHERE tipo_logistica = 'Terceirizada';

-- 2. Mapear valores conhecidos inválidos
UPDATE clientes SET tipo_logistica = 'TERCEIRIZADA' WHERE tipo_logistica = 'Retirada';

-- 3. Garantir que não há valores NULL ou outros
UPDATE clientes SET tipo_logistica = 'PROPRIA' 
WHERE tipo_logistica IS NULL OR tipo_logistica NOT IN ('PROPRIA', 'TERCEIRIZADA');

-- 4. Agora aplicar constraint
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_logistica_canonical 
CHECK (tipo_logistica IN ('PROPRIA', 'TERCEIRIZADA'));