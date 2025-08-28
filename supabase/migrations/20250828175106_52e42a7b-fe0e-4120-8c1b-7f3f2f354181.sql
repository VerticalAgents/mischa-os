-- PR-C: Diagnosticar e corrigir todos os dados restantes

-- 1. Forçar todos os status para valores canônicos válidos
UPDATE clientes SET status_cliente = 'ATIVO' WHERE status_cliente IS NULL;
UPDATE clientes SET status_cliente = 'ATIVO' WHERE status_cliente = '';

-- 2. Mapear status específicos encontrados
UPDATE clientes SET status_cliente = 'INATIVO' WHERE status_cliente = 'Standby';

-- 3. Garantir que não há outros valores
UPDATE clientes SET status_cliente = 'ATIVO' 
WHERE status_cliente NOT IN ('ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY');

-- 4. Aplicar apenas uma constraint por vez para testar
ALTER TABLE clientes 
ADD CONSTRAINT ck_status_cliente_canonical 
CHECK (status_cliente IN ('ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY'));