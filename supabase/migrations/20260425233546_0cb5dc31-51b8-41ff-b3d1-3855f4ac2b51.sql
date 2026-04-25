ALTER TABLE public.receitas_base 
ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;