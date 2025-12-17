-- Adicionar coluna prazo_pagamento_dias à tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS prazo_pagamento_dias INTEGER DEFAULT 7;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.clientes.prazo_pagamento_dias IS 'Prazo de pagamento para boleto: 7, 14 ou 21 dias';