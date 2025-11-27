-- Fase 1: Corrigir RLS da tabela agendamentos_clientes
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage their agendamentos_clientes" ON agendamentos_clientes;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read agendamentos_clientes" 
  ON agendamentos_clientes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert agendamentos_clientes" 
  ON agendamentos_clientes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update agendamentos_clientes" 
  ON agendamentos_clientes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete agendamentos_clientes" 
  ON agendamentos_clientes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));