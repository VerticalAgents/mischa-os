-- Fase 1: Adicionar coluna user_id à tabela configuracoes_sistema
-- Isso permite configurações individuais por usuário

-- 1.1. Adicionar coluna user_id (nullable temporariamente)
ALTER TABLE configuracoes_sistema 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.2. Migrar dados existentes para o usuário admin Lucca
UPDATE configuracoes_sistema 
SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc'
WHERE user_id IS NULL;

-- 1.3. Tornar user_id obrigatório
ALTER TABLE configuracoes_sistema 
ALTER COLUMN user_id SET NOT NULL;

-- 1.4. Criar índice único para (modulo, user_id) - cada usuário só pode ter uma config por módulo
CREATE UNIQUE INDEX configuracoes_sistema_modulo_user_idx 
ON configuracoes_sistema(modulo, user_id);

-- 1.5. Remover políticas antigas
DROP POLICY IF EXISTS "Admins can read configuracoes_sistema" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Permitir atualização de configurações" ON configuracoes_sistema;
DROP POLICY IF EXISTS "Permitir inserção de configurações" ON configuracoes_sistema;

-- 1.6. Criar novas políticas RLS - cada usuário gerencia apenas suas próprias configurações
CREATE POLICY "Users can read own configuracoes" 
ON configuracoes_sistema FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configuracoes" 
ON configuracoes_sistema FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configuracoes" 
ON configuracoes_sistema FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own configuracoes" 
ON configuracoes_sistema FOR DELETE
USING (auth.uid() = user_id);