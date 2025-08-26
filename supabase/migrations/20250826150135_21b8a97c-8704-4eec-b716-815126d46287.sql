
-- Adicionar coluna para armazenar se o cliente deve ser contatado
ALTER TABLE agendamentos_clientes 
ADD COLUMN contatar_cliente boolean DEFAULT false;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN agendamentos_clientes.contatar_cliente IS 'Indica se o cliente deve ser contatado para confirmação';
