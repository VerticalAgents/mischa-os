
-- 1. Remove the current incorrect foreign key constraint
ALTER TABLE public.historico_producao DROP CONSTRAINT IF EXISTS historico_producao_produto_id_fkey;

-- 2. Clean up existing data by mapping old product IDs to new ones based on product name
UPDATE public.historico_producao hp
SET produto_id = pf.id
FROM public.produtos_finais pf
WHERE hp.produto_id IS NOT NULL
  AND hp.produto_id NOT IN (SELECT id FROM public.produtos_finais)
  AND hp.produto_nome = pf.nome;

-- 3. Set invalid produto_id values to NULL to prevent FK constraint violations
UPDATE public.historico_producao hp
SET produto_id = NULL
WHERE hp.produto_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.produtos_finais pf WHERE pf.id = hp.produto_id);

-- 4. Add the correct foreign key constraint pointing to produtos_finais
ALTER TABLE public.historico_producao
ADD CONSTRAINT historico_producao_produto_id_fkey
FOREIGN KEY (produto_id)
REFERENCES public.produtos_finais (id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- 5. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_historico_producao_produto_id ON public.historico_producao(produto_id);
