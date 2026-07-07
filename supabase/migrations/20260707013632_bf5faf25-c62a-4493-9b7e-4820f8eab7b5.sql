
-- 1. Drop unused parallel PL tables (in dependency order)
DROP TABLE IF EXISTS public.coletas_pl CASCADE;
DROP TABLE IF EXISTS public.ordens_producao_pl CASCADE;
DROP TABLE IF EXISTS public.movimentacoes_estoque_produtos_pl CASCADE;
DROP TABLE IF EXISTS public.movimentacoes_estoque_insumos_pl CASCADE;
DROP TABLE IF EXISTS public.receitas_pl CASCADE;
DROP TABLE IF EXISTS public.produtos_pl CASCADE;
DROP TABLE IF EXISTS public.insumos_pl CASCADE;

-- 2. Add nullable cliente_industrial_id to core tables
ALTER TABLE public.insumos
  ADD COLUMN IF NOT EXISTS cliente_industrial_id uuid NULL
  REFERENCES public.clientes_industriais(id) ON DELETE RESTRICT;

ALTER TABLE public.produtos_finais
  ADD COLUMN IF NOT EXISTS cliente_industrial_id uuid NULL
  REFERENCES public.clientes_industriais(id) ON DELETE RESTRICT;

ALTER TABLE public.historico_producao
  ADD COLUMN IF NOT EXISTS cliente_industrial_id uuid NULL
  REFERENCES public.clientes_industriais(id) ON DELETE RESTRICT;

ALTER TABLE public.historico_entregas
  ADD COLUMN IF NOT EXISTS cliente_industrial_id uuid NULL
  REFERENCES public.clientes_industriais(id) ON DELETE RESTRICT;

ALTER TABLE public.historico_entregas
  ADD COLUMN IF NOT EXISTS tipo_movimento text NOT NULL DEFAULT 'venda';

ALTER TABLE public.historico_entregas
  DROP CONSTRAINT IF EXISTS ck_historico_entregas_tipo_movimento;
ALTER TABLE public.historico_entregas
  ADD CONSTRAINT ck_historico_entregas_tipo_movimento
  CHECK (tipo_movimento IN ('venda','coleta_pl'));

-- 3. Partial indexes for performance
CREATE INDEX IF NOT EXISTS idx_insumos_cliente_industrial
  ON public.insumos(cliente_industrial_id) WHERE cliente_industrial_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_produtos_finais_cliente_industrial
  ON public.produtos_finais(cliente_industrial_id) WHERE cliente_industrial_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_historico_producao_cliente_industrial
  ON public.historico_producao(cliente_industrial_id) WHERE cliente_industrial_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_historico_entregas_cliente_industrial
  ON public.historico_entregas(cliente_industrial_id) WHERE cliente_industrial_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_historico_entregas_tipo_movimento
  ON public.historico_entregas(tipo_movimento);

-- 4. Validation trigger: receita PL só pode usar insumos do mesmo cliente_industrial
CREATE OR REPLACE FUNCTION public.validate_itens_receita_cliente_industrial()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_produto_ci uuid;
  v_insumo_ci uuid;
  v_produto_final_id uuid;
BEGIN
  -- itens_receita.receita_id -> receitas_base.produto_final_id
  SELECT rb.produto_final_id INTO v_produto_final_id
  FROM public.receitas_base rb
  WHERE rb.id = NEW.receita_id;

  IF v_produto_final_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT pf.cliente_industrial_id INTO v_produto_ci
  FROM public.produtos_finais pf
  WHERE pf.id = v_produto_final_id;

  SELECT i.cliente_industrial_id INTO v_insumo_ci
  FROM public.insumos i
  WHERE i.id = NEW.insumo_id;

  IF v_produto_ci IS DISTINCT FROM v_insumo_ci THEN
    RAISE EXCEPTION 'Contexto private-label incompatível: produto (cliente_industrial=%) não pode usar insumo (cliente_industrial=%). Todos os insumos da ficha técnica devem pertencer ao mesmo cliente industrial do produto (ou nenhum, no caso Mischa''s).',
      v_produto_ci, v_insumo_ci;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_itens_receita_ci ON public.itens_receita;
CREATE TRIGGER trg_validate_itens_receita_ci
BEFORE INSERT OR UPDATE ON public.itens_receita
FOR EACH ROW EXECUTE FUNCTION public.validate_itens_receita_cliente_industrial();
