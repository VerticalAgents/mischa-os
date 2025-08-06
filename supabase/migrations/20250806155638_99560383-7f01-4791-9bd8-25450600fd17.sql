
-- Adicionar coluna link_google_maps na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS link_google_maps text;
