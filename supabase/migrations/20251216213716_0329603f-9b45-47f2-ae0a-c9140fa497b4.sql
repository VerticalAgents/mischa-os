-- Padronizar forma_pagamento para valores canônicos
UPDATE public.clientes 
SET forma_pagamento = 'BOLETO' 
WHERE forma_pagamento ILIKE '%boleto%' AND forma_pagamento != 'BOLETO';

-- Padronizar tipo_cobranca para valores canônicos
UPDATE public.clientes 
SET tipo_cobranca = 'A_VISTA' 
WHERE (tipo_cobranca ILIKE '%vista%' OR tipo_cobranca = 'À vista') AND tipo_cobranca != 'A_VISTA';

-- Atualizar default da coluna forma_pagamento
ALTER TABLE public.clientes 
ALTER COLUMN forma_pagamento SET DEFAULT 'BOLETO';

-- Atualizar default da coluna tipo_cobranca
ALTER TABLE public.clientes 
ALTER COLUMN tipo_cobranca SET DEFAULT 'A_VISTA';