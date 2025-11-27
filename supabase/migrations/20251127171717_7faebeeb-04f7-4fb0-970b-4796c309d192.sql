-- Fase 2F: Corrigir RLS da tabela giros_semanais_personalizados
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage giros_semanais_personalizados" ON giros_semanais_personalizados;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read giros_semanais_personalizados" 
  ON giros_semanais_personalizados FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert giros_semanais_personalizados" 
  ON giros_semanais_personalizados FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update giros_semanais_personalizados" 
  ON giros_semanais_personalizados FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete giros_semanais_personalizados" 
  ON giros_semanais_personalizados FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));