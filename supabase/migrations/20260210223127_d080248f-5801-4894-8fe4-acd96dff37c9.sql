
-- Tabela para registrar reagendamentos entre semanas
CREATE TABLE public.reagendamentos_entre_semanas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  data_original date NOT NULL,
  data_nova date NOT NULL,
  semana_original date NOT NULL,
  semana_nova date NOT NULL,
  semanas_adiadas integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_reagendamentos_cliente_id ON public.reagendamentos_entre_semanas(cliente_id);
CREATE INDEX idx_reagendamentos_created_at ON public.reagendamentos_entre_semanas(created_at DESC);

-- RLS
ALTER TABLE public.reagendamentos_entre_semanas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reagendamentos"
  ON public.reagendamentos_entre_semanas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert reagendamentos"
  ON public.reagendamentos_entre_semanas FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
