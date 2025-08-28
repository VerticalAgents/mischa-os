-- Adicionar constraint para validar status_cliente
ALTER TABLE clientes 
DROP CONSTRAINT IF EXISTS check_status_cliente_valid;

ALTER TABLE clientes 
ADD CONSTRAINT check_status_cliente_valid 
CHECK (status_cliente IN ('Ativo', 'Inativo', 'Em análise', 'A ativar', 'Standby'));