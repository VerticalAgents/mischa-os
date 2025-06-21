
-- Create table for fixed costs
CREATE TABLE public.custos_fixos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  subcategoria TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  frequencia TEXT NOT NULL DEFAULT 'mensal',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for variable costs
CREATE TABLE public.custos_variaveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  subcategoria TEXT NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  frequencia TEXT NOT NULL DEFAULT 'mensal',
  percentual_faturamento NUMERIC NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to both tables
ALTER TABLE public.custos_fixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_variaveis ENABLE ROW LEVEL SECURITY;

-- Create policies for custos_fixos (public access for now)
CREATE POLICY "Allow all operations on custos_fixos" 
  ON public.custos_fixos 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create policies for custos_variaveis (public access for now)
CREATE POLICY "Allow all operations on custos_variaveis" 
  ON public.custos_variaveis 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_custos_fixos_updated_at
  BEFORE UPDATE ON public.custos_fixos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custos_variaveis_updated_at
  BEFORE UPDATE ON public.custos_variaveis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
