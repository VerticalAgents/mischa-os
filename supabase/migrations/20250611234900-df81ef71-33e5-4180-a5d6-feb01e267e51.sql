
-- Criar tabela para armazenar proporções padrão dos produtos
CREATE TABLE public.proporcoes_padrao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id uuid NOT NULL REFERENCES public.produtos_finais(id) ON DELETE CASCADE,
  percentual numeric NOT NULL CHECK (percentual >= 0 AND percentual <= 100),
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(produto_id)
);

-- Adicionar RLS
ALTER TABLE public.proporcoes_padrao ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso total (já que não há auth implementado)
CREATE POLICY "Permitir acesso total a proporcoes_padrao" 
  ON public.proporcoes_padrao 
  FOR ALL 
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_proporcoes_padrao_updated_at
  BEFORE UPDATE ON public.proporcoes_padrao
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais se não existirem
INSERT INTO public.proporcoes_padrao (produto_id, percentual, ativo)
SELECT id, 0, true 
FROM public.produtos_finais 
WHERE ativo = true
ON CONFLICT (produto_id) DO NOTHING;
