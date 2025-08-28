-- Fix JSONB defaults and normalize existing data
ALTER TABLE public.clientes ALTER COLUMN janelas_entrega SET DEFAULT '[]'::jsonb;

-- Normalize existing NULL values to empty arrays
UPDATE public.clientes 
SET janelas_entrega = '[]'::jsonb 
WHERE janelas_entrega IS NULL;

UPDATE public.clientes 
SET categorias_habilitadas = '[]'::jsonb 
WHERE categorias_habilitadas IS NULL;