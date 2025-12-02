-- Create table for distributor expositor tracking
CREATE TABLE public.distribuidores_expositores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero_expositores INTEGER NOT NULL DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cliente_id)
);

-- Enable RLS
ALTER TABLE public.distribuidores_expositores ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies
CREATE POLICY "Only admins can read distribuidores_expositores"
ON public.distribuidores_expositores
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert distribuidores_expositores"
ON public.distribuidores_expositores
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update distribuidores_expositores"
ON public.distribuidores_expositores
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete distribuidores_expositores"
ON public.distribuidores_expositores
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_distribuidores_expositores_updated_at
BEFORE UPDATE ON public.distribuidores_expositores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();