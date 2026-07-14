CREATE TABLE public.niveis_embalagem_produto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  produto_id UUID NOT NULL REFERENCES public.produtos_finais(id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  nome TEXT NOT NULL,
  abreviacao TEXT NOT NULL,
  unidades_por_nivel INTEGER NOT NULL CHECK (unidades_por_nivel >= 1),
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, nome),
  UNIQUE (produto_id, unidades_por_nivel)
);

CREATE INDEX idx_niveis_embalagem_produto_produto_id ON public.niveis_embalagem_produto(produto_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.niveis_embalagem_produto TO authenticated;
GRANT ALL ON public.niveis_embalagem_produto TO service_role;

ALTER TABLE public.niveis_embalagem_produto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or staff can view niveis_embalagem"
  ON public.niveis_embalagem_produto FOR SELECT TO authenticated
  USING (user_id = public.get_owner_id(auth.uid()));

CREATE POLICY "Owner or staff with edit can manage niveis_embalagem"
  ON public.niveis_embalagem_produto FOR ALL TO authenticated
  USING (user_id = public.get_owner_id(auth.uid()))
  WITH CHECK (user_id = public.get_owner_id(auth.uid()));

CREATE OR REPLACE FUNCTION public.update_niveis_embalagem_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_niveis_embalagem_updated_at
  BEFORE UPDATE ON public.niveis_embalagem_produto
  FOR EACH ROW EXECUTE FUNCTION public.update_niveis_embalagem_updated_at();