
-- Adicionar campo categorias_habilitadas na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS categorias_habilitadas JSONB DEFAULT '[1]'::jsonb;

-- Criar tabela para armazenar preços por categoria de produto por cliente
CREATE TABLE IF NOT EXISTS public.precos_categoria_cliente (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  categoria_id INTEGER NOT NULL REFERENCES public.categorias_produto(id) ON DELETE CASCADE,
  preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cliente_id, categoria_id)
);

-- Adicionar RLS para segurança
ALTER TABLE public.precos_categoria_cliente ENABLE ROW LEVEL SECURITY;

-- Permitir acesso completo (para simplicidade, pode ser refinado depois)
CREATE POLICY "Permitir acesso completo a precos_categoria_cliente" 
  ON public.precos_categoria_cliente 
  FOR ALL 
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_precos_categoria_cliente_updated_at
  BEFORE UPDATE ON public.precos_categoria_cliente
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
