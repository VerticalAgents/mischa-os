-- Add GestaoClick tracking fields to agendamentos_clientes
ALTER TABLE public.agendamentos_clientes 
ADD COLUMN IF NOT EXISTS gestaoclick_venda_id TEXT,
ADD COLUMN IF NOT EXISTS gestaoclick_sincronizado_em TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_agendamentos_gestaoclick_venda_id 
ON public.agendamentos_clientes(gestaoclick_venda_id) 
WHERE gestaoclick_venda_id IS NOT NULL;