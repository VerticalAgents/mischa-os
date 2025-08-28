-- PR-C: Adicionar constraints rigorosas nas colunas de cliente existentes
-- Isso previne tokens corrompidos no banco de dados

-- 1. Adicionar constraints CHECK para status_cliente
ALTER TABLE clientes 
ADD CONSTRAINT ck_status_cliente_canonical 
CHECK (
  status_cliente IS NULL OR 
  status_cliente IN ('ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY')
);

-- 2. Adicionar constraints CHECK para tipo_logistica  
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_logistica_canonical 
CHECK (
  tipo_logistica IS NULL OR 
  tipo_logistica IN ('PROPRIA', 'TERCEIRIZADA')
);

-- 3. Adicionar constraints CHECK para tipo_cobranca
ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (
  tipo_cobranca IS NULL OR 
  tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO')
);

-- 4. Adicionar constraints CHECK para forma_pagamento
ALTER TABLE clientes 
ADD CONSTRAINT ck_forma_pagamento_canonical 
CHECK (
  forma_pagamento IS NULL OR 
  forma_pagamento IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO')
);

-- 5. Migrar dados atuais: mapear valores em português para códigos canônicos
-- Status Cliente
UPDATE clientes SET status_cliente = 'ATIVO' WHERE status_cliente = 'Ativo';
UPDATE clientes SET status_cliente = 'INATIVO' WHERE status_cliente = 'Inativo';
UPDATE clientes SET status_cliente = 'EM_ANALISE' WHERE status_cliente = 'Em análise';
UPDATE clientes SET status_cliente = 'A_ATIVAR' WHERE status_cliente = 'A ativar';
UPDATE clientes SET status_cliente = 'INATIVO' WHERE status_cliente = 'Standby';

-- Tipo Logística  
UPDATE clientes SET tipo_logistica = 'PROPRIA' WHERE tipo_logistica = 'Própria';
UPDATE clientes SET tipo_logistica = 'TERCEIRIZADA' WHERE tipo_logistica = 'Terceirizada';

-- Tipo Cobrança
UPDATE clientes SET tipo_cobranca = 'A_VISTA' WHERE tipo_cobranca = 'À vista';
UPDATE clientes SET tipo_cobranca = 'PARCELADO' WHERE tipo_cobranca = 'Parcelado';
UPDATE clientes SET tipo_cobranca = 'A_PRAZO' WHERE tipo_cobranca = 'A prazo';

-- Forma Pagamento
UPDATE clientes SET forma_pagamento = 'BOLETO' WHERE forma_pagamento = 'Boleto';
UPDATE clientes SET forma_pagamento = 'PIX' WHERE forma_pagamento = 'PIX';
UPDATE clientes SET forma_pagamento = 'DINHEIRO' WHERE forma_pagamento = 'Dinheiro';
UPDATE clientes SET forma_pagamento = 'CARTAO_CREDITO' WHERE forma_pagamento = 'Cartão de crédito';
UPDATE clientes SET forma_pagamento = 'CARTAO_DEBITO' WHERE forma_pagamento = 'Cartão de débito';

-- 6. Migrar tokens corrompidos conhecidos
UPDATE clientes SET status_cliente = 'INATIVO' 
WHERE status_cliente IN ('customer_deleted', 'client_inactive', 'inactive', 'deleted');

UPDATE clientes SET status_cliente = 'ATIVO' 
WHERE status_cliente IN ('user_active', 'active');

-- 7. Criar função para validar JSON se necessário (para campos JSONB futuros)
CREATE OR REPLACE FUNCTION validate_json_not_empty(input_json jsonb)
RETURNS boolean AS $$
BEGIN
  RETURN input_json IS NOT NULL AND jsonb_typeof(input_json) = 'object';
END;
$$ LANGUAGE plpgsql IMMUTABLE;