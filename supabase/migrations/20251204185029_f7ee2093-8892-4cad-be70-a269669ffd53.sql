-- Atualizar constraint para aceitar o novo status efetivado_inbound
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE public.leads ADD CONSTRAINT leads_status_check CHECK (status IN (
  'cadastrado',
  'visitado',
  'followup_wpp_pendente',
  'followup_wpp_tentativa',
  'followup_wpp_negociacao',
  'followup_presencial_pendente',
  'followup_presencial_tentativa',
  'followup_presencial_negociacao',
  'efetivado_imediato',
  'efetivado_wpp',
  'efetivado_presencial',
  'efetivado_inbound',
  'perdido_imediato',
  'perdido_wpp',
  'perdido_presencial'
));