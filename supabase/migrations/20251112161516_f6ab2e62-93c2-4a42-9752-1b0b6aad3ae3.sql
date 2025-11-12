-- Remove constraint de bandeira dos cartões de crédito
-- Isso permite que o usuário cadastre cartões com qualquer bandeira
ALTER TABLE cartoes_credito 
DROP CONSTRAINT IF EXISTS cartoes_credito_bandeira_check;