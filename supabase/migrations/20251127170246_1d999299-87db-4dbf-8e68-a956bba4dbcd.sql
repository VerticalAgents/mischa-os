-- Fase 2B: Corrigir RLS da tabela leads
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage leads" ON leads;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read leads" 
  ON leads FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert leads" 
  ON leads FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update leads" 
  ON leads FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete leads" 
  ON leads FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));