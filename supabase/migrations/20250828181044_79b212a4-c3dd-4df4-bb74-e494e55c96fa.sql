-- Primeiro, remove duplicatas se existirem
DELETE FROM formas_pagamento WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY nome ORDER BY id) as rn 
    FROM formas_pagamento
  ) t WHERE rn > 1
);

DELETE FROM tipos_cobranca WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY nome ORDER BY id) as rn 
    FROM tipos_cobranca  
  ) t WHERE rn > 1
);

-- Remove opções indesejadas primeiro
DELETE FROM formas_pagamento 
WHERE nome IN ('Cartão de Crédito', 'Cartão de Débito');

DELETE FROM tipos_cobranca 
WHERE nome = 'Parcelado';

-- Garante que as opções corretas estão presentes
INSERT INTO formas_pagamento (nome) VALUES
  ('Boleto'),
  ('Dinheiro'), 
  ('PIX')
ON CONFLICT DO NOTHING;

INSERT INTO tipos_cobranca (nome, descricao) VALUES
  ('À vista', 'Pagamento à vista'),
  ('Consignado', 'Pagamento com cartão')  
ON CONFLICT DO NOTHING;

-- Atualiza clientes que possam ter valores inválidos
UPDATE clientes SET 
  forma_pagamento = 'Boleto'
WHERE forma_pagamento NOT IN ('Boleto', 'Dinheiro', 'PIX');

UPDATE clientes SET
  tipo_cobranca = 'À vista' 
WHERE tipo_cobranca NOT IN ('À vista', 'Consignado');