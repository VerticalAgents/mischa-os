-- Permitir representantes lerem e gerenciarem preços por categoria de seus clientes
CREATE POLICY "Representante manages own precos_categoria_cliente"
ON public.precos_categoria_cliente
FOR ALL
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