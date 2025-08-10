
-- Fix the compute_entrega_itens function to handle ambiguous column references
-- and improve error handling for edge cases
CREATE OR REPLACE FUNCTION public.compute_entrega_itens(p_agendamento_id uuid)
 RETURNS TABLE(produto_id uuid, produto_nome text, quantidade integer)
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_tipo text;
  v_qtd_total integer;
  v_itens jsonb;
BEGIN
  -- Get agendamento data with explicit table alias
  SELECT a.tipo_pedido, a.quantidade_total, a.itens_personalizados
  INTO v_tipo, v_qtd_total, v_itens
  FROM public.agendamentos_clientes a
  WHERE a.id = p_agendamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  -- Itens personalizados (caso 'Alterado')
  IF v_tipo = 'Alterado' AND v_itens IS NOT NULL AND jsonb_typeof(v_itens) = 'array' AND jsonb_array_length(v_itens) > 0 THEN
    RETURN QUERY
    WITH itens AS (
      SELECT 
        COALESCE(
          NULLIF(elem->>'produto_id','')::uuid,
          (
            SELECT pf.id 
            FROM public.produtos_finais pf
            WHERE lower(pf.nome) = lower(COALESCE(elem->>'produto', elem->>'nome')) 
            LIMIT 1
          )
        ) AS produto_id,
        COALESCE(elem->>'produto', elem->>'nome') AS produto_nome,
        GREATEST(0, COALESCE((elem->>'quantidade')::int, 0)) AS quantidade
      FROM jsonb_array_elements(v_itens) AS elem
    )
    SELECT i.produto_id, COALESCE(pf.nome, i.produto_nome) as produto_nome, i.quantidade
    FROM itens i
    LEFT JOIN public.produtos_finais pf ON pf.id = i.produto_id
    WHERE i.produto_id IS NOT NULL AND i.quantidade > 0;
    RETURN;
  END IF;

  -- Tentar proporções padrão
  IF EXISTS (SELECT 1 FROM public.proporcoes_padrao pr WHERE pr.ativo = true) THEN
    RETURN QUERY
    WITH base AS (
      SELECT pf.id AS produto_id, pf.nome, pr.percentual::numeric
      FROM public.proporcoes_padrao pr
      JOIN public.produtos_finais pf ON pf.id = pr.produto_id
      WHERE pr.ativo = true AND pf.ativo = true
    ),
    calc AS (
      SELECT 
        produto_id,
        nome,
        FLOOR((percentual/100.0) * v_qtd_total)::int AS q_base
      FROM base
    ),
    resto AS (
      SELECT v_qtd_total - COALESCE(SUM(q_base),0) AS r FROM calc
    ),
    distrib AS (
      SELECT b.*, row_number() OVER (ORDER BY b.percentual DESC, b.nome) AS rn
      FROM base b
    ),
    add_resto AS (
      SELECT 
        d.produto_id,
        d.nome,
        (SELECT q_base FROM calc c WHERE c.produto_id=d.produto_id) 
          + CASE WHEN d.rn <= (SELECT r FROM resto) THEN 1 ELSE 0 END AS quantidade
      FROM distrib d
    )
    SELECT ar.produto_id, ar.nome, ar.quantidade 
    FROM add_resto ar 
    WHERE ar.quantidade > 0;
    
    -- Check if we actually returned any rows
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Nenhum produto com proporção válida encontrado para agendamento %', p_agendamento_id;
    END IF;
    RETURN;
  END IF;

  -- Fallback: distribuição igual entre até 5 produtos ativos
  RETURN QUERY
  WITH lista AS (
    SELECT pf.id AS produto_id, pf.nome
    FROM public.produtos_finais pf
    WHERE pf.ativo = true
    ORDER BY pf.nome
    LIMIT 5
  ),
  n AS (SELECT COUNT(*)::int as cnt FROM lista),
  calc AS (
    SELECT 
      l.produto_id,
      l.nome,
      (v_qtd_total / GREATEST(1,(SELECT cnt FROM n)))::int AS base,
      ROW_NUMBER() OVER (ORDER BY l.nome) AS rn
    FROM lista l
  ),
  resto AS (SELECT v_qtd_total % GREATEST(1,(SELECT cnt FROM n)) AS r)
  SELECT 
    c.produto_id,
    c.nome,
    c.base + CASE WHEN c.rn <= (SELECT r FROM resto) THEN 1 ELSE 0 END AS quantidade
  FROM calc c
  WHERE c.base + CASE WHEN c.rn <= (SELECT r FROM resto) THEN 1 ELSE 0 END > 0;
  
  -- Check if we have any active products at all
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum produto ativo encontrado para distribuição no agendamento %', p_agendamento_id;
  END IF;
END;
$function$;

-- Ensure the unique constraint exists for movimentacoes_estoque_produtos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ux_mov_prod_ref'
  ) THEN
    ALTER TABLE public.movimentacoes_estoque_produtos 
    ADD CONSTRAINT ux_mov_prod_ref 
    UNIQUE (referencia_tipo, referencia_id);
  END IF;
END $$;

-- Ensure triggers exist for movimentacoes_estoque_produtos
DO $$
BEGIN
  -- Check and create prevent_negative trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_mov_prod_prevent_negative'
  ) THEN
    CREATE TRIGGER trg_mov_prod_prevent_negative
      BEFORE INSERT ON public.movimentacoes_estoque_produtos
      FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_produto();
  END IF;
  
  -- Check and create sync trigger
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_mov_prod_sync'
  ) THEN
    CREATE TRIGGER trg_mov_prod_sync
      AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque_produtos
      FOR EACH ROW EXECUTE FUNCTION public.sync_estoque_produto();
  END IF;
END $$;
