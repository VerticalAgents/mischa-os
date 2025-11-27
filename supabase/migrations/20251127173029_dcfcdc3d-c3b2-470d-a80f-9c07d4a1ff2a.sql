-- Fase 2G: Corrigir RLS da tabela precos_categoria_cliente
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage precos_categoria_cliente" ON precos_categoria_cliente;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read precos_categoria_cliente" 
  ON precos_categoria_cliente FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert precos_categoria_cliente" 
  ON precos_categoria_cliente FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update precos_categoria_cliente" 
  ON precos_categoria_cliente FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete precos_categoria_cliente" 
  ON precos_categoria_cliente FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));