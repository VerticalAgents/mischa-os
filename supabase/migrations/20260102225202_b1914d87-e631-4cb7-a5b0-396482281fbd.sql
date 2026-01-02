-- Add NF status tracking field to agendamentos_clientes
ALTER TABLE public.agendamentos_clientes 
ADD COLUMN IF NOT EXISTS gestaoclick_nf_status text DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.agendamentos_clientes.gestaoclick_nf_status IS 'Status da NF no GestaoClick: em_aberto, emitida, ou NULL se não existe NF';