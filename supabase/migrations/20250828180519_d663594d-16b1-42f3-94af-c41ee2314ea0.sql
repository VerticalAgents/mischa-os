-- Populate formas_pagamento table with commonly used payment methods
INSERT INTO formas_pagamento (nome) VALUES
  ('Boleto'),
  ('PIX'),
  ('Cartão de Crédito'),
  ('Cartão de Débito'),
  ('Dinheiro')
ON CONFLICT (nome) DO NOTHING;

-- Populate tipos_cobranca table with commonly used charge types  
INSERT INTO tipos_cobranca (nome, descricao) VALUES
  ('À vista', 'Pagamento à vista'),
  ('Parcelado', 'Pagamento parcelado')
ON CONFLICT (nome) DO NOTHING;

-- Update clientes table to use the configured payment methods and charge types
-- Map canonical codes back to configured names
UPDATE clientes SET 
  forma_pagamento = CASE 
    WHEN forma_pagamento = 'BOLETO' THEN 'Boleto'
    WHEN forma_pagamento = 'PIX' THEN 'PIX'
    WHEN forma_pagamento = 'CREDITO' THEN 'Cartão de Crédito'
    WHEN forma_pagamento = 'DEBITO' THEN 'Cartão de Débito'
    WHEN forma_pagamento = 'DINHEIRO' THEN 'Dinheiro'
    ELSE forma_pagamento
  END,
  tipo_cobranca = CASE
    WHEN tipo_cobranca = 'A_VISTA' THEN 'À vista'
    WHEN tipo_cobranca = 'PARCELADO' THEN 'Parcelado'
    ELSE tipo_cobranca
  END
WHERE forma_pagamento IN ('BOLETO', 'PIX', 'CREDITO', 'DEBITO', 'DINHEIRO')
   OR tipo_cobranca IN ('A_VISTA', 'PARCELADO');

-- Remove the strict canonical constraints since we're now using dynamic configurations
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_forma_pagamento_canonical;
ALTER TABLE clientes DROP CONSTRAINT IF EXISTS ck_tipo_cobranca_canonical;