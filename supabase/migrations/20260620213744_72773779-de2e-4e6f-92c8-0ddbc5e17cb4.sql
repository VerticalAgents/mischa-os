ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS prazo_pagamento_tipo text NOT NULL DEFAULT 'dias',
  ADD COLUMN IF NOT EXISTS prazo_pagamento_dia_semana smallint,
  ADD COLUMN IF NOT EXISTS prazo_pagamento_dias_minimos smallint;

ALTER TABLE public.clientes
  DROP CONSTRAINT IF EXISTS clientes_prazo_pagamento_tipo_check;
ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_prazo_pagamento_tipo_check
  CHECK (prazo_pagamento_tipo IN ('dias','proximo_dia_semana'));