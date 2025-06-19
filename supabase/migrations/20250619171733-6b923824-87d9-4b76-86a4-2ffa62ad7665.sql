
-- Criar tabela para relacionar clientes com categorias de produto
CREATE TABLE public.clientes_categorias (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  categoria_id integer NOT NULL REFERENCES public.categorias_produto(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(cliente_id, categoria_id)
);

-- Habilitar RLS na tabela
ALTER TABLE public.clientes_categorias ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir acesso a todos os dados (ajustar conforme necessário)
CREATE POLICY "Allow all operations on clientes_categorias" 
  ON public.clientes_categorias 
  FOR ALL 
  USING (true);

-- Adicionar coluna categorias_habilitadas como JSONB na tabela clientes se ainda não existir
-- (para manter compatibilidade com o código atual)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clientes' 
    AND column_name = 'categorias_habilitadas'
  ) THEN
    ALTER TABLE public.clientes ADD COLUMN categorias_habilitadas jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
