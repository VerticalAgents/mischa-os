-- Adicionar campo para armazenar o transaction_id do PagHiper
ALTER TABLE public.agendamentos_clientes 
ADD COLUMN IF NOT EXISTS paghiper_transaction_id TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.agendamentos_clientes.paghiper_transaction_id IS 'ID da transação do boleto no PagHiper (ex: 02UJ3AECX2WRDJ26)';