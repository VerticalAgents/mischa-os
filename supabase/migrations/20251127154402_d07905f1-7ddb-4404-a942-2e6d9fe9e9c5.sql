-- Fase 2A: Corrigir RLS da tabela historico_entregas
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage historico_entregas" ON historico_entregas;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read historico_entregas" 
  ON historico_entregas FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert historico_entregas" 
  ON historico_entregas FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update historico_entregas" 
  ON historico_entregas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete historico_entregas" 
  ON historico_entregas FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));