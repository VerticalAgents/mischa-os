-- Adicionar campo gestaoclick_nf_id para rastrear NF gerada
ALTER TABLE agendamentos_clientes 
ADD COLUMN IF NOT EXISTS gestaoclick_nf_id TEXT;