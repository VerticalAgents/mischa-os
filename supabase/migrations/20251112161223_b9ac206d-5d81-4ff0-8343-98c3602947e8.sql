-- Remove constraint de nome único dos cartões de crédito
-- Isso permite que o usuário cadastre múltiplos cartões com o mesmo nome
ALTER TABLE cartoes_credito 
DROP CONSTRAINT IF EXISTS nome_cartao_unico;