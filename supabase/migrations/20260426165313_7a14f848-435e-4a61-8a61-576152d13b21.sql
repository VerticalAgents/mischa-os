-- Permitir que representantes e staff leiam as configurações do owner
DROP POLICY IF EXISTS "Users can read own configuracoes" ON public.configuracoes_sistema;

CREATE POLICY "Users can read own or owner configuracoes"
ON public.configuracoes_sistema
FOR SELECT
USING (
  auth.uid() = user_id
  OR user_id = public.get_owner_id(auth.uid())
);