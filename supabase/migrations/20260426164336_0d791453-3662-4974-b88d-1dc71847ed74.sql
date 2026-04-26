CREATE POLICY "Representante reads own clientes_categorias"
ON public.clientes_categorias FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes
    WHERE representante_id = get_my_representante_id()
  )
);

CREATE POLICY "Representante manages own clientes_categorias"
ON public.clientes_categorias FOR ALL
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes
    WHERE representante_id = get_my_representante_id()
  )
)
WITH CHECK (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes
    WHERE representante_id = get_my_representante_id()
  )
);