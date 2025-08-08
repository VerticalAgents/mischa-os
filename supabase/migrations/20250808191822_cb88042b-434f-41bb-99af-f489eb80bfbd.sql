
-- Adicionar campos necessários para snapshot e controle de status na tabela historico_producao
ALTER TABLE public.historico_producao 
ADD COLUMN IF NOT EXISTS rendimento_usado NUMERIC(12,3);

ALTER TABLE public.historico_producao 
ADD COLUMN IF NOT EXISTS unidades_previstas NUMERIC(12,3);

ALTER TABLE public.historico_producao 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Registrado';

ALTER TABLE public.historico_producao 
ADD COLUMN IF NOT EXISTS confirmado_em TIMESTAMPTZ;

-- Adicionar campos de referência para rastreamento das movimentações
ALTER TABLE public.movimentacoes_estoque_produtos 
ADD COLUMN IF NOT EXISTS referencia_tipo TEXT;

ALTER TABLE public.movimentacoes_estoque_produtos 
ADD COLUMN IF NOT EXISTS referencia_id UUID;

ALTER TABLE public.movimentacoes_estoque_insumos 
ADD COLUMN IF NOT EXISTS referencia_tipo TEXT;

ALTER TABLE public.movimentacoes_estoque_insumos 
ADD COLUMN IF NOT EXISTS referencia_id UUID;

-- Atualizar registros existentes que não têm status definido
UPDATE public.historico_producao 
SET status = 'Registrado' 
WHERE status IS NULL;

-- Criar índices para melhor performance nas consultas de referência
CREATE INDEX IF NOT EXISTS idx_mov_produtos_referencia 
ON public.movimentacoes_estoque_produtos (referencia_tipo, referencia_id);

CREATE INDEX IF NOT EXISTS idx_mov_insumos_referencia 
ON public.movimentacoes_estoque_insumos (referencia_tipo, referencia_id);
