-- Remove as constraints de verificação canônicas primeiro  
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_forma_pagamento_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_cobranca_canonical;

-- Limpa as tabelas mantendo apenas as opções desejadas
DELETE FROM formas_pagamento WHERE nome NOT IN ('Boleto', 'Dinheiro', 'PIX');
DELETE FROM tipos_cobranca WHERE nome NOT IN ('À vista', 'Consignado');

-- Garante que as opções corretas existem (só insere se não existir)
INSERT INTO formas_pagamento (nome) 
SELECT 'Boleto' WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Boleto');

INSERT INTO formas_pagamento (nome) 
SELECT 'Dinheiro' WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'Dinheiro');

INSERT INTO formas_pagamento (nome) 
SELECT 'PIX' WHERE NOT EXISTS (SELECT 1 FROM formas_pagamento WHERE nome = 'PIX');

INSERT INTO tipos_cobranca (nome, descricao) 
SELECT 'À vista', 'Pagamento à vista' WHERE NOT EXISTS (SELECT 1 FROM tipos_cobranca WHERE nome = 'À vista');

INSERT INTO tipos_cobranca (nome, descricao) 
SELECT 'Consignado', 'Pagamento com cartão' WHERE NOT EXISTS (SELECT 1 FROM tipos_cobranca WHERE nome = 'Consignado');

-- Atualiza clientes que possam ter valores inválidos
UPDATE clientes SET 
  forma_pagamento = 'Boleto'
WHERE forma_pagamento NOT IN ('Boleto', 'Dinheiro', 'PIX') OR forma_pagamento IS NULL;

UPDATE clientes SET
  tipo_cobranca = 'À vista' 
WHERE tipo_cobranca NOT IN ('À vista', 'Consignado') OR tipo_cobranca IS NULL;