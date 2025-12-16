-- Adicionar campo para ID do cliente no GestãoClick
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS gestaoclick_cliente_id TEXT;