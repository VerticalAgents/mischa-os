-- Adicionar coluna tipo_pessoa (PF ou PJ) com default 'PJ'
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'PJ';

-- Adicionar coluna inscricao_estadual (nullable)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;

-- Adicionar constraint para validar valores de tipo_pessoa
ALTER TABLE public.clientes 
ADD CONSTRAINT clientes_tipo_pessoa_check 
CHECK (tipo_pessoa IN ('PF', 'PJ'));

-- Comentários para documentação
COMMENT ON COLUMN public.clientes.tipo_pessoa IS 'Tipo de pessoa: PF (Pessoa Física) ou PJ (Pessoa Jurídica)';
COMMENT ON COLUMN public.clientes.inscricao_estadual IS 'Inscrição Estadual - apenas para Pessoa Jurídica';