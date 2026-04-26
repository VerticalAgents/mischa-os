-- Allow representatives (and staff) to read tipos_cobranca and formas_pagamento
-- of their owner, mirroring the pattern already in place for categorias_produto.

CREATE POLICY "Owner or staff can view tipos_cobranca"
ON public.tipos_cobranca FOR SELECT
USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff can view formas_pagamento"
ON public.formas_pagamento FOR SELECT
USING (user_id = public.get_owner_id(auth.uid()));