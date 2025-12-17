-- Permitir que todos os usuários autenticados leiam motivos de troca
-- (são dados de referência, não operacionais)
DROP POLICY IF EXISTS "Only admins can read motivos_troca" ON motivos_troca;

CREATE POLICY "Authenticated users can read motivos_troca" 
  ON motivos_troca FOR SELECT 
  TO authenticated 
  USING (true);