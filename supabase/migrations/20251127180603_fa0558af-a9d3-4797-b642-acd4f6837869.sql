-- Fase 3: Isolamento por usuário para subcategorias_custos e cartoes_credito

-- 1. Adicionar user_id à tabela subcategorias_custos
ALTER TABLE public.subcategorias_custos 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Adicionar user_id à tabela cartoes_credito
ALTER TABLE public.cartoes_credito 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Migrar dados existentes para Lucca (admin)
UPDATE public.subcategorias_custos 
SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' 
WHERE user_id IS NULL;

UPDATE public.cartoes_credito 
SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' 
WHERE user_id IS NULL;

-- 4. Tornar user_id NOT NULL após migração
ALTER TABLE public.subcategorias_custos 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.cartoes_credito 
ALTER COLUMN user_id SET NOT NULL;

-- 5. Criar índices únicos para evitar duplicatas por usuário
CREATE UNIQUE INDEX idx_subcategorias_custos_nome_tipo_user 
ON public.subcategorias_custos(nome, tipo, user_id);

-- Usar nome + ultimos_digitos + user_id para cartões (permite múltiplos cartões com mesmo nome)
CREATE UNIQUE INDEX idx_cartoes_credito_nome_digitos_user 
ON public.cartoes_credito(nome, ultimos_digitos, user_id);

-- 6. Remover políticas RLS antigas de subcategorias_custos
DROP POLICY IF EXISTS "Authenticated users can read subcategorias_custos" ON public.subcategorias_custos;
DROP POLICY IF EXISTS "Only admins can modify subcategorias_custos" ON public.subcategorias_custos;
DROP POLICY IF EXISTS "Only admins can insert subcategorias_custos" ON public.subcategorias_custos;
DROP POLICY IF EXISTS "Only admins can update subcategorias_custos" ON public.subcategorias_custos;
DROP POLICY IF EXISTS "Only admins can delete subcategorias_custos" ON public.subcategorias_custos;

-- 7. Criar novas políticas RLS para subcategorias_custos (por user_id)
CREATE POLICY "Users can read own subcategorias_custos"
ON public.subcategorias_custos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subcategorias_custos"
ON public.subcategorias_custos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subcategorias_custos"
ON public.subcategorias_custos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subcategorias_custos"
ON public.subcategorias_custos FOR DELETE
USING (auth.uid() = user_id);

-- 8. Remover políticas RLS antigas de cartoes_credito
DROP POLICY IF EXISTS "Admins podem gerenciar cartoes_credito" ON public.cartoes_credito;
DROP POLICY IF EXISTS "Usuários autenticados podem ler cartoes_credito" ON public.cartoes_credito;

-- 9. Criar novas políticas RLS para cartoes_credito (por user_id)
CREATE POLICY "Users can read own cartoes_credito"
ON public.cartoes_credito FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cartoes_credito"
ON public.cartoes_credito FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cartoes_credito"
ON public.cartoes_credito FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cartoes_credito"
ON public.cartoes_credito FOR DELETE
USING (auth.uid() = user_id);