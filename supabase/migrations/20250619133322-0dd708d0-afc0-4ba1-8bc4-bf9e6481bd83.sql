
-- Criar tabela para tipos de cobrança
CREATE TABLE public.tipos_cobranca (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir alguns tipos de cobrança padrão
INSERT INTO public.tipos_cobranca (nome, descricao) VALUES
('À vista', 'Pagamento à vista'),
('A prazo', 'Pagamento parcelado'),
('Boleto', 'Cobrança via boleto bancário'),
('Cartão', 'Pagamento com cartão');

-- Criar trigger para updated_at
CREATE TRIGGER update_tipos_cobranca_updated_at
  BEFORE UPDATE ON public.tipos_cobranca
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
