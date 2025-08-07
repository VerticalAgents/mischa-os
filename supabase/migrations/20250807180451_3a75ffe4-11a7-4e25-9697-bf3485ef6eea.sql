
-- Criar tabela para armazenar os rendimentos de receitas por produto
CREATE TABLE IF NOT EXISTS public.rendimentos_receita_produto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receita_id uuid NOT NULL REFERENCES public.receitas_base(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES public.produtos_finais(id) ON DELETE CASCADE,
  rendimento numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(receita_id, produto_id)
);

-- Adicionar RLS para a tabela
ALTER TABLE public.rendimentos_receita_produto ENABLE ROW LEVEL SECURITY;

-- Política para visualização (usuários autenticados)
CREATE POLICY "Users can view rendimentos_receita_produto" 
  ON public.rendimentos_receita_produto
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Política para modificações (apenas admins)
CREATE POLICY "Admins can manage rendimentos_receita_produto" 
  ON public.rendimentos_receita_produto
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_rendimentos_receita_produto_updated_at
  BEFORE UPDATE ON public.rendimentos_receita_produto
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rendimentos_receita_produto_receita_id 
  ON public.rendimentos_receita_produto(receita_id);

CREATE INDEX IF NOT EXISTS idx_rendimentos_receita_produto_produto_id 
  ON public.rendimentos_receita_produto(produto_id);
