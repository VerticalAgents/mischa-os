-- Fix the inconsistent Choco Duo record: stock movements exist but status was never updated
UPDATE public.historico_producao 
SET status = 'Confirmado', confirmado_em = now() 
WHERE id = 'f41d54c9-3df0-43f8-8bb8-9dcff048d31c' 
  AND status = 'Registrado';