-- Representantes podem ler categorias de estabelecimento (lista global do admin)
CREATE POLICY "Representantes can read categorias_estabelecimento"
ON public.categorias_estabelecimento
FOR SELECT
USING (public.is_representante());

-- Representantes podem ler os tipos de logistica do seu owner (admin)
CREATE POLICY "Representantes can read owner tipos_logistica"
ON public.tipos_logistica
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.representante_accounts ra
    WHERE ra.auth_user_id = auth.uid()
      AND ra.ativo = true
      AND ra.owner_id = tipos_logistica.user_id
  )
);