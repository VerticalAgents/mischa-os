-- ============================================
-- ISOLAMENTO DO MENU PRECIFICAÇÃO
-- Adicionar user_id a insumos, receitas_base e produtos_finais
-- ============================================

-- 1. INSUMOS
-- Adicionar coluna user_id
ALTER TABLE insumos ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Migrar dados existentes para Lucca
UPDATE insumos SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;

-- Tornar NOT NULL
ALTER TABLE insumos ALTER COLUMN user_id SET NOT NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_insumos_user_id ON insumos(user_id);

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage insumos" ON insumos;
DROP POLICY IF EXISTS "Users can view insumos" ON insumos;

-- Criar nova política baseada em user_id
CREATE POLICY "Users can manage own insumos" ON insumos FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. RECEITAS_BASE
-- Adicionar coluna user_id
ALTER TABLE receitas_base ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Migrar dados existentes para Lucca
UPDATE receitas_base SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;

-- Tornar NOT NULL
ALTER TABLE receitas_base ALTER COLUMN user_id SET NOT NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_receitas_base_user_id ON receitas_base(user_id);

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage receitas_base" ON receitas_base;
DROP POLICY IF EXISTS "Users can view receitas_base" ON receitas_base;

-- Criar nova política baseada em user_id
CREATE POLICY "Users can manage own receitas_base" ON receitas_base FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. PRODUTOS_FINAIS
-- Adicionar coluna user_id
ALTER TABLE produtos_finais ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Migrar dados existentes para Lucca
UPDATE produtos_finais SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;

-- Tornar NOT NULL
ALTER TABLE produtos_finais ALTER COLUMN user_id SET NOT NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_produtos_finais_user_id ON produtos_finais(user_id);

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage produtos_finais" ON produtos_finais;
DROP POLICY IF EXISTS "Users can view produtos_finais" ON produtos_finais;

-- Criar nova política baseada em user_id
CREATE POLICY "Users can manage own produtos_finais" ON produtos_finais FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. ITENS_RECEITA - Atualizar RLS para verificar via receita pai
DROP POLICY IF EXISTS "Admins can manage itens_receita" ON itens_receita;
DROP POLICY IF EXISTS "Users can view itens_receita" ON itens_receita;

CREATE POLICY "Users can manage own itens_receita" ON itens_receita FOR ALL
  USING (EXISTS (
    SELECT 1 FROM receitas_base r WHERE r.id = receita_id AND r.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM receitas_base r WHERE r.id = receita_id AND r.user_id = auth.uid()
  ));

-- 5. COMPONENTES_PRODUTO - Atualizar RLS para verificar via produto pai
DROP POLICY IF EXISTS "Admins can manage componentes_produto" ON componentes_produto;
DROP POLICY IF EXISTS "Users can view componentes_produto" ON componentes_produto;

CREATE POLICY "Users can manage own componentes_produto" ON componentes_produto FOR ALL
  USING (EXISTS (
    SELECT 1 FROM produtos_finais p WHERE p.id = produto_id AND p.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM produtos_finais p WHERE p.id = produto_id AND p.user_id = auth.uid()
  ));