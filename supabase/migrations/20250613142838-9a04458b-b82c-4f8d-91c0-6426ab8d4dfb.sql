
-- Criar tabela de subcategorias de produto
CREATE TABLE public.subcategorias_produto (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_id INTEGER NOT NULL REFERENCES categorias_produto(id) ON DELETE CASCADE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para melhor performance
CREATE INDEX idx_subcategorias_produto_categoria_id ON subcategorias_produto(categoria_id);
CREATE INDEX idx_subcategorias_produto_ativo ON subcategorias_produto(ativo);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subcategorias_produto_updated_at
  BEFORE UPDATE ON subcategorias_produto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
