
-- Criar extensão se não existir
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de movimentações de produtos (criar apenas se não existir)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque_produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  data_movimentacao timestamptz NOT NULL DEFAULT now(),
  produto_id uuid NOT NULL REFERENCES public.produtos_finais(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  observacao text,
  referencia_tipo text,
  referencia_id uuid
);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_mov_prod_produto ON public.movimentacoes_estoque_produtos(produto_id);
CREATE INDEX IF NOT EXISTS idx_mov_prod_created ON public.movimentacoes_estoque_produtos(created_at);

-- Tabela de movimentações de insumos (criar apenas se não existir)
CREATE TABLE IF NOT EXISTS public.movimentacoes_estoque_insumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  data_movimentacao timestamptz NOT NULL DEFAULT now(),
  insumo_id uuid NOT NULL REFERENCES public.insumos(id) ON DELETE RESTRICT,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade numeric(12,3) NOT NULL CHECK (quantidade > 0),
  observacao text,
  referencia_tipo text,
  referencia_id uuid
);

-- Índices para insumos
CREATE INDEX IF NOT EXISTS idx_mov_ins_insumo ON public.movimentacoes_estoque_insumos(insumo_id);
CREATE INDEX IF NOT EXISTS idx_mov_ins_created ON public.movimentacoes_estoque_insumos(created_at);

-- FUNÇÕES E TRIGGERS PARA PRODUTOS
CREATE OR REPLACE FUNCTION public.saldo_produto(p_id uuid)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' THEN quantidade
    WHEN tipo = 'saida' THEN -quantidade
    ELSE quantidade
  END), 0)
  FROM public.movimentacoes_estoque_produtos
  WHERE produto_id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.sync_estoque_produto()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.produto_id IS DISTINCT FROM OLD.produto_id) THEN
    UPDATE public.produtos_finais
      SET estoque_atual = public.saldo_produto(OLD.produto_id)
      WHERE id = OLD.produto_id;
  END IF;
  
  UPDATE public.produtos_finais
    SET estoque_atual = public.saldo_produto(COALESCE(NEW.produto_id, OLD.produto_id))
    WHERE id = COALESCE(NEW.produto_id, OLD.produto_id);
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_estoque_produto ON public.movimentacoes_estoque_produtos;
CREATE TRIGGER trg_sync_estoque_produto
AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque_produtos
FOR EACH ROW EXECUTE FUNCTION public.sync_estoque_produto();

CREATE OR REPLACE FUNCTION public.prevent_negative_produto()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE saldo_atual numeric;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo = 'saida' THEN
    saldo_atual := public.saldo_produto(NEW.produto_id);
    IF saldo_atual < NEW.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente (produto). Disponível: %, Tentado: %', saldo_atual, NEW.quantidade;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_negative_produto ON public.movimentacoes_estoque_produtos;
CREATE TRIGGER trg_prevent_negative_produto
BEFORE INSERT ON public.movimentacoes_estoque_produtos
FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_produto();

-- FUNÇÕES E TRIGGERS PARA INSUMOS
CREATE OR REPLACE FUNCTION public.saldo_insumo(i_id uuid)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' THEN quantidade
    WHEN tipo = 'saida' THEN -quantidade
    ELSE quantidade
  END), 0)
  FROM public.movimentacoes_estoque_insumos
  WHERE insumo_id = i_id;
$$;

CREATE OR REPLACE FUNCTION public.sync_estoque_insumo()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND NEW.insumo_id IS DISTINCT FROM OLD.insumo_id) THEN
    UPDATE public.insumos
      SET estoque_atual = public.saldo_insumo(OLD.insumo_id)
      WHERE id = OLD.insumo_id;
  END IF;
  
  UPDATE public.insumos
    SET estoque_atual = public.saldo_insumo(COALESCE(NEW.insumo_id, OLD.insumo_id))
    WHERE id = COALESCE(NEW.insumo_id, OLD.insumo_id);
  
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_estoque_insumo ON public.movimentacoes_estoque_insumos;
CREATE TRIGGER trg_sync_estoque_insumo
AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque_insumos
FOR EACH ROW EXECUTE FUNCTION public.sync_estoque_insumo();

CREATE OR REPLACE FUNCTION public.prevent_negative_insumo()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE saldo_atual numeric;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.tipo = 'saida' THEN
    saldo_atual := public.saldo_insumo(NEW.insumo_id);
    IF saldo_atual < NEW.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente (insumo). Disponível: %, Tentado: %', saldo_atual, NEW.quantidade;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_negative_insumo ON public.movimentacoes_estoque_insumos;
CREATE TRIGGER trg_prevent_negative_insumo
BEFORE INSERT ON public.movimentacoes_estoque_insumos
FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_insumo();

-- POLÍTICAS RLS
ALTER TABLE public.movimentacoes_estoque_produtos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mov_prod_select ON public.movimentacoes_estoque_produtos;
CREATE POLICY mov_prod_select ON public.movimentacoes_estoque_produtos 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS mov_prod_insert ON public.movimentacoes_estoque_produtos;
CREATE POLICY mov_prod_insert ON public.movimentacoes_estoque_produtos 
FOR INSERT TO authenticated WITH CHECK (true);

ALTER TABLE public.movimentacoes_estoque_insumos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mov_ins_select ON public.movimentacoes_estoque_insumos;
CREATE POLICY mov_ins_select ON public.movimentacoes_estoque_insumos 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS mov_ins_insert ON public.movimentacoes_estoque_insumos;
CREATE POLICY mov_ins_insert ON public.movimentacoes_estoque_insumos 
FOR INSERT TO authenticated WITH CHECK (true);
