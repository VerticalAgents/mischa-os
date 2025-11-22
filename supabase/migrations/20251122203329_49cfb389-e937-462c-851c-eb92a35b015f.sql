-- Migration: Atualização de Status do Funil de Leads - Parte 1: Remover Constraint
-- Data: 2025-11-22
-- Descrição: Remover constraint antigo e atualizar para novos valores

-- 1. Backup dos dados atuais (para rollback se necessário)
CREATE TABLE IF NOT EXISTS leads_backup_status_20251122 AS 
SELECT id, status, created_at, updated_at FROM leads;

-- 2. Remover o constraint antigo de status
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 3. Atualizar mapeamento de status antigos para novos
-- Entrada
UPDATE leads SET status = 'cadastrado' WHERE status = 'Cadastrado';
UPDATE leads SET status = 'visitado' WHERE status = 'Visitados';

-- Follow-up (mapeamento baseado em lógica de negócio)
UPDATE leads SET status = 'followup_wpp_pendente' WHERE status = 'ContatosCapturados';
UPDATE leads SET status = 'followup_wpp_tentativa' WHERE status = 'ChamadosWhatsApp';
UPDATE leads SET status = 'followup_wpp_negociacao' WHERE status = 'RespostaWhatsApp';

-- Fechamento
UPDATE leads SET status = 'efetivado_imediato' WHERE status = 'EfetivadosImediato';
UPDATE leads SET status = 'efetivado_wpp' WHERE status = 'EfetivadosWhatsApp';

-- Perda
UPDATE leads SET status = 'perdido_imediato' WHERE status = 'Perdidos';

-- 4. Adicionar novo constraint com os valores atualizados
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (
  status IN (
    'cadastrado', 'visitado',
    'followup_wpp_pendente', 'followup_wpp_tentativa', 'followup_wpp_negociacao',
    'followup_presencial_pendente', 'followup_presencial_tentativa', 'followup_presencial_negociacao',
    'efetivado_imediato', 'efetivado_wpp', 'efetivado_presencial',
    'perdido_imediato', 'perdido_wpp', 'perdido_presencial'
  )
);