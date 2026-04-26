-- Permite que representantes salvem agendamentos para os próprios clientes

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

CREATE POLICY "Representante deletes own agendamentos"
ON public.agendamentos_clientes
FOR DELETE
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);
