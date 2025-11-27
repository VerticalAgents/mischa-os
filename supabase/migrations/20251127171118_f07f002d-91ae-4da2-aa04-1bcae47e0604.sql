-- Fase 2D: Corrigir RLS da tabela confirmacoes_reposicao
-- Remove política permissiva atual
DROP POLICY IF EXISTS "Users can manage their confirmacoes_reposicao" ON confirmacoes_reposicao;

-- Criar políticas restritas apenas para admins
CREATE POLICY "Only admins can read confirmacoes_reposicao" 
  ON confirmacoes_reposicao FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert confirmacoes_reposicao" 
  ON confirmacoes_reposicao FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update confirmacoes_reposicao" 
  ON confirmacoes_reposicao FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete confirmacoes_reposicao" 
  ON confirmacoes_reposicao FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));