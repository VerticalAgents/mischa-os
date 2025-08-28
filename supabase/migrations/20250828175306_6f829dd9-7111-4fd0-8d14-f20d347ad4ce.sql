-- PR-C: Corrigir dados de forma_pagamento

-- 1. Ver todas as formas de pagamento existentes
UPDATE clientes SET forma_pagamento = 'BOLETO' WHERE forma_pagamento = 'Boleto';
UPDATE clientes SET forma_pagamento = 'DINHEIRO' WHERE forma_pagamento = 'Dinheiro';

-- 2. Garantir que não há valores nulos/vazios
UPDATE clientes SET forma_pagamento = 'BOLETO' 
WHERE forma_pagamento IS NULL OR forma_pagamento = '';

-- 3. Aplicar constraint final
ALTER TABLE clientes 
ADD CONSTRAINT ck_forma_pagamento_canonical 
CHECK (forma_pagamento IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO'));