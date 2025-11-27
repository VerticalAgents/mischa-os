-- Phase 2: Add user_id to 6 configuration tables

-- 1. Add user_id column to all 6 tables
ALTER TABLE public.proporcoes_padrao ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.representantes ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.rotas_entrega ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.tipos_logistica ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.formas_pagamento ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.tipos_cobranca ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Migrate existing data to Lucca's user_id
UPDATE public.proporcoes_padrao SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;
UPDATE public.representantes SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;
UPDATE public.rotas_entrega SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;
UPDATE public.tipos_logistica SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;
UPDATE public.formas_pagamento SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;
UPDATE public.tipos_cobranca SET user_id = '7618131a-45cf-4641-af12-cf56e5c42bdc' WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL
ALTER TABLE public.proporcoes_padrao ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.representantes ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.rotas_entrega ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tipos_logistica ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.formas_pagamento ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tipos_cobranca ALTER COLUMN user_id SET NOT NULL;

-- 4. Create unique indexes (nome + user_id for uniqueness per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proporcoes_padrao_produto_user ON public.proporcoes_padrao(produto_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_representantes_nome_user ON public.representantes(nome, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rotas_entrega_nome_user ON public.rotas_entrega(nome, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_logistica_nome_user ON public.tipos_logistica(nome, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_formas_pagamento_nome_user ON public.formas_pagamento(nome, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tipos_cobranca_nome_user ON public.tipos_cobranca(nome, user_id);

-- 5. Drop old RLS policies and create new ones for proporcoes_padrao
DROP POLICY IF EXISTS "Users can read proporcoes_padrao" ON public.proporcoes_padrao;
DROP POLICY IF EXISTS "Only admins can modify proporcoes_padrao" ON public.proporcoes_padrao;
DROP POLICY IF EXISTS "Only admins can update proporcoes_padrao" ON public.proporcoes_padrao;
DROP POLICY IF EXISTS "Only admins can delete proporcoes_padrao" ON public.proporcoes_padrao;

CREATE POLICY "Users can read own proporcoes_padrao" ON public.proporcoes_padrao
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own proporcoes_padrao" ON public.proporcoes_padrao
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own proporcoes_padrao" ON public.proporcoes_padrao
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own proporcoes_padrao" ON public.proporcoes_padrao
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Drop old RLS policies and create new ones for representantes
DROP POLICY IF EXISTS "Authenticated users can read representantes" ON public.representantes;
DROP POLICY IF EXISTS "Only admins can modify representantes" ON public.representantes;

CREATE POLICY "Users can read own representantes" ON public.representantes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own representantes" ON public.representantes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own representantes" ON public.representantes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own representantes" ON public.representantes
  FOR DELETE USING (auth.uid() = user_id);

-- 7. Drop old RLS policies and create new ones for rotas_entrega
DROP POLICY IF EXISTS "Authenticated users can read rotas_entrega" ON public.rotas_entrega;
DROP POLICY IF EXISTS "Only admins can modify rotas_entrega" ON public.rotas_entrega;

CREATE POLICY "Users can read own rotas_entrega" ON public.rotas_entrega
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rotas_entrega" ON public.rotas_entrega
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rotas_entrega" ON public.rotas_entrega
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rotas_entrega" ON public.rotas_entrega
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Drop old RLS policies and create new ones for tipos_logistica
DROP POLICY IF EXISTS "Authenticated users can read tipos_logistica" ON public.tipos_logistica;
DROP POLICY IF EXISTS "Only admins can modify tipos_logistica" ON public.tipos_logistica;

CREATE POLICY "Users can read own tipos_logistica" ON public.tipos_logistica
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tipos_logistica" ON public.tipos_logistica
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tipos_logistica" ON public.tipos_logistica
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tipos_logistica" ON public.tipos_logistica
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Drop old RLS policies and create new ones for formas_pagamento
DROP POLICY IF EXISTS "Authenticated users can read formas_pagamento" ON public.formas_pagamento;
DROP POLICY IF EXISTS "Only admins can modify formas_pagamento" ON public.formas_pagamento;

CREATE POLICY "Users can read own formas_pagamento" ON public.formas_pagamento
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own formas_pagamento" ON public.formas_pagamento
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own formas_pagamento" ON public.formas_pagamento
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own formas_pagamento" ON public.formas_pagamento
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Drop old RLS policies and create new ones for tipos_cobranca
DROP POLICY IF EXISTS "Authenticated users can read tipos_cobranca" ON public.tipos_cobranca;
DROP POLICY IF EXISTS "Only admins can modify tipos_cobranca" ON public.tipos_cobranca;

CREATE POLICY "Users can read own tipos_cobranca" ON public.tipos_cobranca
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tipos_cobranca" ON public.tipos_cobranca
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tipos_cobranca" ON public.tipos_cobranca
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tipos_cobranca" ON public.tipos_cobranca
  FOR DELETE USING (auth.uid() = user_id);