-- Garantir policies de INSERT/UPDATE para representantes em agendamentos_clientes
DROP POLICY IF EXISTS "Representante inserts own agendamentos" ON public.agendamentos_clientes;
DROP POLICY IF EXISTS "Representante updates own agendamentos" ON public.agendamentos_clientes;

CREATE POLICY "Representante inserts own agendamentos"
ON public.agendamentos_clientes
FOR INSERT
WITH CHECK (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);

CREATE POLICY "Representante updates own agendamentos"
ON public.agendamentos_clientes
FOR UPDATE
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
)
WITH CHECK (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);