-- Histórico de entregas: somente leitura, restrito aos clientes do representante
CREATE POLICY "Representante reads own historico_entregas"
ON public.historico_entregas
FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);

-- Distribuidores/expositores: somente leitura, restrito aos clientes do representante
CREATE POLICY "Representante reads own distribuidores_expositores"
ON public.distribuidores_expositores
FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);

-- Histórico de giro semanal consolidado: somente leitura, restrito aos clientes do representante
CREATE POLICY "Representante reads own historico_giro_semanal_consolidado"
ON public.historico_giro_semanal_consolidado
FOR SELECT
USING (
  is_representante() AND cliente_id IN (
    SELECT id FROM public.clientes WHERE representante_id = get_my_representante_id()
  )
);