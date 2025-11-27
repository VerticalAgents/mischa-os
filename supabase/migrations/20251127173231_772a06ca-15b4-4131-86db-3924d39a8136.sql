-- Fase 2H: Corrigir RLS da tabela categorias_estabelecimento
-- Remove políticas permissivas atuais
DROP POLICY IF EXISTS "Authenticated users can read categorias_estabelecimento" ON categorias_estabelecimento;
DROP POLICY IF EXISTS "Authenticated users can insert categorias_estabelecimento" ON categorias_estabelecimento;
DROP POLICY IF EXISTS "Authenticated users can update categorias_estabelecimento" ON categorias_estabelecimento;
DROP POLICY IF EXISTS "Authenticated users can delete categorias_estabelecimento" ON categorias_estabelecimento;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read categorias_estabelecimento" 
  ON categorias_estabelecimento FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert categorias_estabelecimento" 
  ON categorias_estabelecimento FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update categorias_estabelecimento" 
  ON categorias_estabelecimento FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete categorias_estabelecimento" 
  ON categorias_estabelecimento FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));