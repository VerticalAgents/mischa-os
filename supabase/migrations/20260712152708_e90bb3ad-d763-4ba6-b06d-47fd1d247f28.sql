-- Fase 2: Consigned inventory support for private-label
-- Add cliente_id to produtos (nullable = Mischa's own stock; else consigned by that client)
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS cliente_id uuid NULL REFERENCES public.clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS produtos_cliente_id_idx ON public.produtos(cliente_id);

-- Ensure insumos has the same shape (safety: no-op if already exists)
ALTER TABLE public.insumos
  ADD COLUMN IF NOT EXISTS cliente_id uuid NULL REFERENCES public.clientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS insumos_cliente_id_idx ON public.insumos(cliente_id);