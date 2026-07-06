
-- 1. clientes_industriais
CREATE TABLE public.clientes_industriais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  cnpj text,
  contato_nome text,
  contato_email text,
  contato_telefone text,
  endereco text,
  preco_industrializacao_unitario numeric(10,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes_industriais TO authenticated;
GRANT ALL ON public.clientes_industriais TO service_role;
ALTER TABLE public.clientes_industriais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_clientes_industriais" ON public.clientes_industriais
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);
CREATE TRIGGER trg_upd_clientes_industriais BEFORE UPDATE ON public.clientes_industriais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. insumos_pl
CREATE TABLE public.insumos_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_industrial_id uuid NOT NULL REFERENCES public.clientes_industriais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'Matéria Prima',
  volume_bruto numeric NOT NULL DEFAULT 0,
  unidade_medida text NOT NULL DEFAULT 'g',
  estoque_atual numeric NOT NULL DEFAULT 0,
  estoque_minimo numeric NOT NULL DEFAULT 0,
  estoque_ideal numeric,
  ultima_entrada timestamptz,
  observacoes text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insumos_pl TO authenticated;
GRANT ALL ON public.insumos_pl TO service_role;
ALTER TABLE public.insumos_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_insumos_pl" ON public.insumos_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);
CREATE TRIGGER trg_upd_insumos_pl BEFORE UPDATE ON public.insumos_pl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. produtos_pl
CREATE TABLE public.produtos_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_industrial_id uuid NOT NULL REFERENCES public.clientes_industriais(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  peso_unitario numeric,
  unidades_producao integer NOT NULL DEFAULT 1,
  estoque_atual numeric NOT NULL DEFAULT 0,
  estoque_minimo numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos_pl TO authenticated;
GRANT ALL ON public.produtos_pl TO service_role;
ALTER TABLE public.produtos_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_produtos_pl" ON public.produtos_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);
CREATE TRIGGER trg_upd_produtos_pl BEFORE UPDATE ON public.produtos_pl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. receitas_pl
CREATE TABLE public.receitas_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  produto_pl_id uuid NOT NULL REFERENCES public.produtos_pl(id) ON DELETE CASCADE,
  insumo_pl_id uuid NOT NULL REFERENCES public.insumos_pl(id) ON DELETE RESTRICT,
  quantidade numeric NOT NULL,
  unidade_medida text NOT NULL DEFAULT 'g',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (produto_pl_id, insumo_pl_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas_pl TO authenticated;
GRANT ALL ON public.receitas_pl TO service_role;
ALTER TABLE public.receitas_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_receitas_pl" ON public.receitas_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);
CREATE TRIGGER trg_upd_receitas_pl BEFORE UPDATE ON public.receitas_pl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. movimentacoes_estoque_insumos_pl
CREATE TABLE public.movimentacoes_estoque_insumos_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  insumo_pl_id uuid NOT NULL REFERENCES public.insumos_pl(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade numeric NOT NULL,
  data_movimentacao timestamptz NOT NULL DEFAULT now(),
  referencia_tipo text,
  referencia_id uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque_insumos_pl TO authenticated;
GRANT ALL ON public.movimentacoes_estoque_insumos_pl TO service_role;
ALTER TABLE public.movimentacoes_estoque_insumos_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_mov_insumos_pl" ON public.movimentacoes_estoque_insumos_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);

-- 6. movimentacoes_estoque_produtos_pl
CREATE TABLE public.movimentacoes_estoque_produtos_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  produto_pl_id uuid NOT NULL REFERENCES public.produtos_pl(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
  quantidade numeric NOT NULL,
  data_movimentacao timestamptz NOT NULL DEFAULT now(),
  referencia_tipo text,
  referencia_id uuid,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movimentacoes_estoque_produtos_pl TO authenticated;
GRANT ALL ON public.movimentacoes_estoque_produtos_pl TO service_role;
ALTER TABLE public.movimentacoes_estoque_produtos_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_mov_produtos_pl" ON public.movimentacoes_estoque_produtos_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);

-- 7. ordens_producao_pl
CREATE TABLE public.ordens_producao_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_industrial_id uuid NOT NULL REFERENCES public.clientes_industriais(id),
  produto_pl_id uuid NOT NULL REFERENCES public.produtos_pl(id),
  quantidade_planejada numeric NOT NULL,
  quantidade_produzida numeric NOT NULL DEFAULT 0,
  data_producao date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'Planejada' CHECK (status IN ('Planejada','Em produção','Concluída','Cancelada')),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_producao_pl TO authenticated;
GRANT ALL ON public.ordens_producao_pl TO service_role;
ALTER TABLE public.ordens_producao_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_ordens_pl" ON public.ordens_producao_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);
CREATE TRIGGER trg_upd_ordens_producao_pl BEFORE UPDATE ON public.ordens_producao_pl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. coletas_pl
CREATE TABLE public.coletas_pl (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_industrial_id uuid NOT NULL REFERENCES public.clientes_industriais(id),
  data_coleta date NOT NULL DEFAULT CURRENT_DATE,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  valor_total numeric NOT NULL DEFAULT 0,
  nota_fiscal text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coletas_pl TO authenticated;
GRANT ALL ON public.coletas_pl TO service_role;
ALTER TABLE public.coletas_pl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all_coletas_pl" ON public.coletas_pl
  FOR ALL TO authenticated
  USING (public.get_owner_id(auth.uid()) = owner_id)
  WITH CHECK (public.get_owner_id(auth.uid()) = owner_id);
CREATE TRIGGER trg_upd_coletas_pl BEFORE UPDATE ON public.coletas_pl
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Funções de saldo
CREATE OR REPLACE FUNCTION public.saldo_insumo_pl(i_id uuid)
RETURNS numeric LANGUAGE sql STABLE SET search_path='public' AS $$
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' THEN quantidade
    WHEN tipo = 'saida' THEN -quantidade
    ELSE quantidade END), 0)
  FROM public.movimentacoes_estoque_insumos_pl WHERE insumo_pl_id = i_id;
$$;

CREATE OR REPLACE FUNCTION public.saldo_produto_pl(p_id uuid)
RETURNS numeric LANGUAGE sql STABLE SET search_path='public' AS $$
  SELECT COALESCE(SUM(CASE
    WHEN tipo = 'entrada' THEN quantidade
    WHEN tipo = 'saida' THEN -quantidade
    ELSE quantidade END), 0)
  FROM public.movimentacoes_estoque_produtos_pl WHERE produto_pl_id = p_id;
$$;

-- Trigger: sync estoque insumo PL + ultima_entrada
CREATE OR REPLACE FUNCTION public.sync_estoque_insumo_pl()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN
  IF (TG_OP='UPDATE' AND NEW.insumo_pl_id IS DISTINCT FROM OLD.insumo_pl_id) THEN
    UPDATE public.insumos_pl SET estoque_atual = public.saldo_insumo_pl(OLD.insumo_pl_id) WHERE id=OLD.insumo_pl_id;
  END IF;
  UPDATE public.insumos_pl SET estoque_atual = public.saldo_insumo_pl(COALESCE(NEW.insumo_pl_id,OLD.insumo_pl_id))
    WHERE id = COALESCE(NEW.insumo_pl_id,OLD.insumo_pl_id);
  IF TG_OP='INSERT' AND NEW.tipo='entrada' THEN
    UPDATE public.insumos_pl SET ultima_entrada = NEW.data_movimentacao WHERE id=NEW.insumo_pl_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_negative_insumo_pl()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
DECLARE s numeric;
BEGIN
  IF TG_OP='INSERT' AND NEW.tipo='saida' THEN
    s := public.saldo_insumo_pl(NEW.insumo_pl_id);
    IF s < NEW.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente (insumo PL). Disponível: %, Tentado: %', s, NEW.quantidade;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_neg_insumo_pl BEFORE INSERT ON public.movimentacoes_estoque_insumos_pl
  FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_insumo_pl();
CREATE TRIGGER trg_sync_insumo_pl AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque_insumos_pl
  FOR EACH ROW EXECUTE FUNCTION public.sync_estoque_insumo_pl();

CREATE OR REPLACE FUNCTION public.sync_estoque_produto_pl()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
BEGIN
  IF (TG_OP='UPDATE' AND NEW.produto_pl_id IS DISTINCT FROM OLD.produto_pl_id) THEN
    UPDATE public.produtos_pl SET estoque_atual = public.saldo_produto_pl(OLD.produto_pl_id) WHERE id=OLD.produto_pl_id;
  END IF;
  UPDATE public.produtos_pl SET estoque_atual = public.saldo_produto_pl(COALESCE(NEW.produto_pl_id,OLD.produto_pl_id))
    WHERE id = COALESCE(NEW.produto_pl_id,OLD.produto_pl_id);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_negative_produto_pl()
RETURNS trigger LANGUAGE plpgsql SET search_path='public' AS $$
DECLARE s numeric;
BEGIN
  IF TG_OP='INSERT' AND NEW.tipo='saida' THEN
    s := public.saldo_produto_pl(NEW.produto_pl_id);
    IF s < NEW.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente (produto PL). Disponível: %, Tentado: %', s, NEW.quantidade;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_neg_produto_pl BEFORE INSERT ON public.movimentacoes_estoque_produtos_pl
  FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_produto_pl();
CREATE TRIGGER trg_sync_produto_pl AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque_produtos_pl
  FOR EACH ROW EXECUTE FUNCTION public.sync_estoque_produto_pl();

-- Índices
CREATE INDEX idx_insumos_pl_cliente ON public.insumos_pl(cliente_industrial_id);
CREATE INDEX idx_produtos_pl_cliente ON public.produtos_pl(cliente_industrial_id);
CREATE INDEX idx_receitas_pl_produto ON public.receitas_pl(produto_pl_id);
CREATE INDEX idx_mov_ins_pl_insumo ON public.movimentacoes_estoque_insumos_pl(insumo_pl_id);
CREATE INDEX idx_mov_prod_pl_produto ON public.movimentacoes_estoque_produtos_pl(produto_pl_id);
CREATE INDEX idx_ordens_pl_cliente ON public.ordens_producao_pl(cliente_industrial_id);
CREATE INDEX idx_coletas_pl_cliente ON public.coletas_pl(cliente_industrial_id);
