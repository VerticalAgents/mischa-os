
-- Adicionar campo para link do Google Maps na tabela clientes
ALTER TABLE clientes 
ADD COLUMN link_google_maps text;

-- Adicionar comentário para documentar o campo
COMMENT ON COLUMN clientes.link_google_maps IS 'Link para o endereço no Google Maps do cliente';
