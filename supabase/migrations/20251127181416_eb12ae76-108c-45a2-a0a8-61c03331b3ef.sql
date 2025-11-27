-- Fase 4: Isolamento de categorias_produto, subcategorias_produto e criação de categorias_insumo

-- 1. Adicionar user_id em categorias_produto
ALTER TABLE categorias_produto ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Adicionar user_id em subcategorias_produto  
ALTER TABLE subcategorias_produto ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Criar tabela categorias_insumo
CREATE TABLE IF NOT EXISTS categorias_insumo (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'personalizada', -- 'padrao' ou 'personalizada'
  ativo BOOLEAN DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Migrar dados existentes para Lucca
UPDATE categorias_produto 
SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc'
WHERE user_id IS NULL;

UPDATE subcategorias_produto 
SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc'
WHERE user_id IS NULL;

-- 5. Inserir categorias padrão de insumo para Lucca
INSERT INTO categorias_insumo (nome, tipo, user_id) VALUES
('Matéria Prima', 'padrao', '7618131a-45cf-4641-af12-cf56e5c42bdc'),
('Embalagem', 'padrao', '7618131a-45cf-4641-af12-cf56e5c42bdc'),
('Outros', 'padrao', '7618131a-45cf-4641-af12-cf56e5c42bdc');

-- 6. Tornar user_id NOT NULL
ALTER TABLE categorias_produto ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE subcategorias_produto ALTER COLUMN user_id SET NOT NULL;

-- 7. Criar índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_produto_nome_user 
ON categorias_produto(nome, user_id) WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subcategorias_produto_nome_cat_user 
ON subcategorias_produto(nome, categoria_id, user_id) WHERE ativo = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_categorias_insumo_nome_user 
ON categorias_insumo(nome, user_id) WHERE ativo = true;

-- 8. Atualizar RLS em categorias_produto
DROP POLICY IF EXISTS "Usuários podem ver categorias de produto" ON categorias_produto;
DROP POLICY IF EXISTS "Usuários podem criar categorias de produto" ON categorias_produto;
DROP POLICY IF EXISTS "Usuários podem atualizar categorias de produto" ON categorias_produto;
DROP POLICY IF EXISTS "Usuários podem deletar categorias de produto" ON categorias_produto;

ALTER TABLE categorias_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas categorias de produto"
ON categorias_produto FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas categorias de produto"
ON categorias_produto FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas categorias de produto"
ON categorias_produto FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas categorias de produto"
ON categorias_produto FOR DELETE
USING (auth.uid() = user_id);

-- 9. Atualizar RLS em subcategorias_produto
DROP POLICY IF EXISTS "Usuários podem ver subcategorias de produto" ON subcategorias_produto;
DROP POLICY IF EXISTS "Usuários podem criar subcategorias de produto" ON subcategorias_produto;
DROP POLICY IF EXISTS "Usuários podem atualizar subcategorias de produto" ON subcategorias_produto;
DROP POLICY IF EXISTS "Usuários podem deletar subcategorias de produto" ON subcategorias_produto;

ALTER TABLE subcategorias_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas subcategorias de produto"
ON subcategorias_produto FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas subcategorias de produto"
ON subcategorias_produto FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas subcategorias de produto"
ON subcategorias_produto FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas subcategorias de produto"
ON subcategorias_produto FOR DELETE
USING (auth.uid() = user_id);

-- 10. RLS em categorias_insumo
ALTER TABLE categorias_insumo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas categorias de insumo"
ON categorias_insumo FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas categorias de insumo"
ON categorias_insumo FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas categorias de insumo"
ON categorias_insumo FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas categorias de insumo"
ON categorias_insumo FOR DELETE
USING (auth.uid() = user_id);

-- 11. Trigger para updated_at em categorias_insumo
CREATE TRIGGER update_categorias_insumo_updated_at
  BEFORE UPDATE ON categorias_insumo
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();