-- Remove opções indesejadas das formas de pagamento
DELETE FROM formas_pagamento 
WHERE nome IN ('Cartão de Crédito', 'Cartão de Débito');

-- Remove opções indesejadas dos tipos de cobrança  
DELETE FROM tipos_cobranca 
WHERE nome IN ('Parcelado');

-- Garante que as opções corretas estão presentes
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