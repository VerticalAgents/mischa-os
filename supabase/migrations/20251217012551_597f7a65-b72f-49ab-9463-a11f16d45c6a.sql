-- Criar tabela para armazenar configurações de integrações
CREATE TABLE public.integracoes_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integracao TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, integracao)
);

-- Habilitar RLS
ALTER TABLE public.integracoes_config ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - apenas o próprio usuário pode acessar suas configurações
CREATE POLICY "Users can read own integracoes_config"
ON public.integracoes_config
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own integracoes_config"
ON public.integracoes_config
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own integracoes_config"
ON public.integracoes_config
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own integracoes_config"
ON public.integracoes_config
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_integracoes_config_updated_at
BEFORE UPDATE ON public.integracoes_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário para documentação
COMMENT ON TABLE public.integracoes_config IS 'Armazena configurações de integrações externas como GestaoClick';