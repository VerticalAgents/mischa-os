
-- Criar tabela para subcategorias de custos
CREATE TABLE public.subcategorias_custos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('fixo', 'variavel')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nome, tipo)
);

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_subcategorias_custos_updated_at
  BEFORE UPDATE ON public.subcategorias_custos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas subcategorias padrão
INSERT INTO public.subcategorias_custos (nome, tipo) VALUES
('Aluguel', 'fixo'),
('Energia Elétrica', 'fixo'),
('Água', 'fixo'),
('Internet', 'fixo'),
('Salários', 'fixo'),
('Impostos', 'variavel'),
('Comissões', 'variavel'),
('Frete', 'variavel'),
('Matéria Prima', 'variavel');
