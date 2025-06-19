
-- Criar tabela para representantes
CREATE TABLE public.representantes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para rotas de entrega
CREATE TABLE public.rotas_entrega (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para categorias de estabelecimento
CREATE TABLE public.categorias_estabelecimento (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para tipos de logística
CREATE TABLE public.tipos_logistica (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  percentual_logistico NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para formas de pagamento
CREATE TABLE public.formas_pagamento (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados padrão para representantes
INSERT INTO public.representantes (nome, email, telefone) VALUES
('João Silva', 'joao@empresa.com', '(11) 99999-9999'),
('Maria Santos', 'maria@empresa.com', '(11) 88888-8888'),
('Pedro Costa', 'pedro@empresa.com', '(11) 77777-7777');

-- Inserir dados padrão para rotas de entrega
INSERT INTO public.rotas_entrega (nome, descricao) VALUES
('Zona Norte', 'Entrega para região norte da cidade'),
('Zona Sul', 'Entrega para região sul da cidade'),
('Centro', 'Entrega para região central'),
('Grande ABC', 'Entrega para região do ABC paulista');

-- Inserir dados padrão para categorias de estabelecimento
INSERT INTO public.categorias_estabelecimento (nome, descricao) VALUES
('Padaria', 'Estabelecimentos do tipo padaria'),
('Lanchonete', 'Lanchonetes e fast food'),
('Restaurante', 'Restaurantes em geral'),
('Mercado', 'Mercados e empórios'),
('Revenda', 'Distribuidores e revendedores');

-- Inserir dados padrão para tipos de logística
INSERT INTO public.tipos_logistica (nome, percentual_logistico) VALUES
('Própria', 0),
('Terceirizada', 5),
('Mista', 3),
('Cliente retira', 0);

-- Inserir dados padrão para formas de pagamento
INSERT INTO public.formas_pagamento (nome) VALUES
('À vista'),
('Boleto'),
('Cartão de crédito'),
('Cartão de débito'),
('PIX'),
('Transferência bancária');

-- Criar triggers para updated_at
CREATE TRIGGER update_representantes_updated_at
  BEFORE UPDATE ON public.representantes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rotas_entrega_updated_at
  BEFORE UPDATE ON public.rotas_entrega
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_categorias_estabelecimento_updated_at
  BEFORE UPDATE ON public.categorias_estabelecimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tipos_logistica_updated_at
  BEFORE UPDATE ON public.tipos_logistica
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formas_pagamento_updated_at
  BEFORE UPDATE ON public.formas_pagamento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
