-- Remove as constraints de verificação canônicas primeiro  
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_forma_pagamento_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_cobranca_canonical;

-- Remove opções indesejadas
DELETE FROM formas_pagamento 
WHERE nome IN ('Cartão de Crédito', 'Cartão de Débito');

DELETE FROM tipos_cobranca 
WHERE nome = 'Parcelado';

-- Garante que apenas as opções corretas estão presentes
-- Remove tudo primeiro
DELETE FROM formas_pagamento WHERE nome NOT IN ('Boleto', 'Dinheiro', 'PIX');
DELETE FROM tipos_cobranca WHERE nome NOT IN ('À vista', 'Consignado');

-- Adiciona as opções corretas
INSERT INTO formas_pagamento (nome) VALUES
  ('Boleto'),
  ('Dinheiro'), 
  ('PIX')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO tipos_cobranca (nome, descricao) VALUES
  ('À vista', 'Pagamento à vista'),
  ('Consignado', 'Pagamento com cartão')  
ON CONFLICT (nome) DO NOTHING;

-- Atualiza clientes que possam ter valores inválidos
UPDATE clientes SET 
  forma_pagamento = 'Boleto'
WHERE forma_pagamento NOT IN ('Boleto', 'Dinheiro', 'PIX');

UPDATE clientes SET
  tipo_cobranca = 'À vista' 
WHERE tipo_cobranca NOT IN ('À vista', 'Consignado');