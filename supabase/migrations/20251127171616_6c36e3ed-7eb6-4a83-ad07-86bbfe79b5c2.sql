-- Fase 2E: Corrigir RLS da tabela clientes_categorias
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage clientes_categorias" ON clientes_categorias;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read clientes_categorias" 
  ON clientes_categorias FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert clientes_categorias" 
  ON clientes_categorias FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update clientes_categorias" 
  ON clientes_categorias FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete clientes_categorias" 
  ON clientes_categorias FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));