-- PR-C: Aplicar constraints de segurança no banco (dados já foram limpos)

-- 1. Migrar para códigos canônicos AGORA (dados já estão limpos)
UPDATE clientes SET status_cliente = 'ATIVO' WHERE status_cliente = 'Ativo';
UPDATE clientes SET status_cliente = 'INATIVO' WHERE status_cliente = 'Inativo';
UPDATE clientes SET status_cliente = 'INATIVO' WHERE status_cliente = 'Standby';

UPDATE clientes SET tipo_logistica = 'PROPRIA' WHERE tipo_logistica = 'Própria';
UPDATE clientes SET tipo_logistica = 'TERCEIRIZADA' WHERE tipo_logistica = 'Terceirizada';

UPDATE clientes SET tipo_cobranca = 'A_VISTA' WHERE tipo_cobranca = 'À vista';
UPDATE clientes SET tipo_cobranca = 'PARCELADO' WHERE tipo_cobranca = 'Parcelado';
UPDATE clientes SET tipo_cobranca = 'A_PRAZO' WHERE tipo_cobranca = 'A prazo';

UPDATE clientes SET forma_pagamento = 'BOLETO' WHERE forma_pagamento = 'Boleto';
UPDATE clientes SET forma_pagamento = 'PIX' WHERE forma_pagamento = 'PIX';
UPDATE clientes SET forma_pagamento = 'DINHEIRO' WHERE forma_pagamento = 'Dinheiro';
UPDATE clientes SET forma_pagamento = 'CARTAO_CREDITO' WHERE forma_pagamento = 'Cartão de crédito';
UPDATE clientes SET forma_pagamento = 'CARTAO_DEBITO' WHERE forma_pagamento = 'Cartão de débito';

-- 2. Agora adicionar constraints (dados já estão limpos e normalizados)
ALTER TABLE clientes 
ADD CONSTRAINT ck_status_cliente_canonical 
CHECK (
  status_cliente IS NULL OR 
  status_cliente IN ('ATIVO', 'INATIVO', 'EM_ANALISE', 'A_ATIVAR', 'STANDBY')
);

ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_logistica_canonical 
CHECK (
  tipo_logistica IS NULL OR 
  tipo_logistica IN ('PROPRIA', 'TERCEIRIZADA')
);

ALTER TABLE clientes 
ADD CONSTRAINT ck_tipo_cobranca_canonical 
CHECK (
  tipo_cobranca IS NULL OR 
  tipo_cobranca IN ('A_VISTA', 'PARCELADO', 'A_PRAZO')
);

ALTER TABLE clientes 
ADD CONSTRAINT ck_forma_pagamento_canonical 
CHECK (
  forma_pagamento IS NULL OR 
  forma_pagamento IN ('BOLETO', 'PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO')
);