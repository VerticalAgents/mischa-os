-- PR-C: Diagnóstico e limpeza ANTES das constraints
-- Primeiro mapear dados corrompidos, depois aplicar constraints

-- 1. Migrar dados atuais: português → códigos canônicos
UPDATE clientes SET status_cliente = 'Ativo' WHERE status_cliente = 'ATIVO';
UPDATE clientes SET status_cliente = 'Inativo' WHERE status_cliente = 'INATIVO';
UPDATE clientes SET status_cliente = 'Ativo' WHERE status_cliente = 'EM_ANALISE';
UPDATE clientes SET status_cliente = 'Ativo' WHERE status_cliente = 'A_ATIVAR';
UPDATE clientes SET status_cliente = 'Inativo' WHERE status_cliente = 'STANDBY';

-- 2. Migrar tokens corrompidos conhecidos para português (depois migraremos para canônicos)
UPDATE clientes SET status_cliente = 'Inativo' 
WHERE status_cliente IN ('customer_deleted', 'client_inactive', 'inactive', 'deleted');

UPDATE clientes SET status_cliente = 'Ativo' 
WHERE status_cliente IN ('user_active', 'active');

-- 3. Limpar tipos logística
UPDATE clientes SET tipo_logistica = 'Própria' WHERE tipo_logistica = 'PROPRIA';
UPDATE clientes SET tipo_logistica = 'Terceirizada' WHERE tipo_logistica = 'TERCEIRIZADA';

-- 4. Limpar tipos cobrança  
UPDATE clientes SET tipo_cobranca = 'À vista' WHERE tipo_cobranca = 'A_VISTA';
UPDATE clientes SET tipo_cobranca = 'Parcelado' WHERE tipo_cobranca = 'PARCELADO';
UPDATE clientes SET tipo_cobranca = 'A prazo' WHERE tipo_cobranca = 'A_PRAZO';

-- 5. Limpar formas pagamento
UPDATE clientes SET forma_pagamento = 'Boleto' WHERE forma_pagamento = 'BOLETO';
UPDATE clientes SET forma_pagamento = 'PIX' WHERE forma_pagamento = 'PIX';
UPDATE clientes SET forma_pagamento = 'Dinheiro' WHERE forma_pagamento = 'DINHEIRO';
UPDATE clientes SET forma_pagamento = 'Cartão de crédito' WHERE forma_pagamento = 'CARTAO_CREDITO';
UPDATE clientes SET forma_pagamento = 'Cartão de débito' WHERE forma_pagamento = 'CARTAO_DEBITO';

-- 6. Garantir que todos os campos tenham valores padrão válidos
UPDATE clientes SET status_cliente = 'Ativo' WHERE status_cliente IS NULL OR status_cliente = '';
UPDATE clientes SET tipo_logistica = 'Própria' WHERE tipo_logistica IS NULL OR tipo_logistica = '';
UPDATE clientes SET tipo_cobranca = 'À vista' WHERE tipo_cobranca IS NULL OR tipo_cobranca = '';
UPDATE clientes SET forma_pagamento = 'Boleto' WHERE forma_pagamento IS NULL OR forma_pagamento = '';