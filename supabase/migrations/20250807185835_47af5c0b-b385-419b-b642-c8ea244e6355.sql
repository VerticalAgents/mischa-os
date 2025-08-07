
-- Migrar dados do histórico de produção para o Supabase
-- Verificar se a tabela já existe e tem os campos corretos
ALTER TABLE public.historico_producao 
  ALTER COLUMN produto_id DROP NOT NULL;

-- Adicionar campos que podem estar faltando se não existirem
DO $$ 
BEGIN 
  -- Verificar e adicionar coluna produto_nome se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'historico_producao' 
                 AND column_name = 'produto_nome') THEN
    ALTER TABLE public.historico_producao ADD COLUMN produto_nome text NOT NULL DEFAULT '';
  END IF;

  -- Verificar e adicionar coluna turno se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'historico_producao' 
                 AND column_name = 'turno') THEN
    ALTER TABLE public.historico_producao ADD COLUMN turno text;
  END IF;

  -- Verificar e adicionar coluna observacoes se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'historico_producao' 
                 AND column_name = 'observacoes') THEN
    ALTER TABLE public.historico_producao ADD COLUMN observacoes text;
  END IF;

  -- Verificar e adicionar coluna origem se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'historico_producao' 
                 AND column_name = 'origem') THEN
    ALTER TABLE public.historico_producao ADD COLUMN origem text DEFAULT 'Manual';
  END IF;
END $$;

-- Criar hook para integração com Supabase no histórico de produção
CREATE OR REPLACE FUNCTION public.update_historico_producao_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para updated_at se não existir
DROP TRIGGER IF EXISTS update_historico_producao_updated_at ON public.historico_producao;
CREATE TRIGGER update_historico_producao_updated_at
  BEFORE UPDATE ON public.historico_producao
  FOR EACH ROW EXECUTE FUNCTION public.update_historico_producao_updated_at();

-- Garantir que as políticas RLS estão corretas
DROP POLICY IF EXISTS "Users can insert historico_producao" ON public.historico_producao;
CREATE POLICY "Users can insert historico_producao" 
  ON public.historico_producao
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update historico_producao" ON public.historico_producao;
CREATE POLICY "Users can update historico_producao" 
  ON public.historico_producao
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can delete historico_producao" ON public.historico_producao;
CREATE POLICY "Users can delete historico_producao" 
  ON public.historico_producao
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);
