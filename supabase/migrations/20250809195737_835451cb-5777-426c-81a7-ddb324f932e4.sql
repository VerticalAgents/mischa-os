
-- [IDEMPOTENTE] Garantir idempotência por CONSTRAINT (e remover índice parcial antigo, se existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ux_mov_prod_ref'
      AND conrelid = 'public.movimentacoes_estoque_produtos'::regclass
  ) THEN
    DROP INDEX IF EXISTS public.ux_mov_prod_entrega_ref;  -- índice parcial antigo
    ALTER TABLE public.movimentacoes_estoque_produtos
      ADD CONSTRAINT ux_mov_prod_ref UNIQUE (referencia_tipo, referencia_id, produto_id);
  END IF;
END$$;

-- Atualizar a função: usa a CONSTRAINT para idempotência
CREATE OR REPLACE FUNCTION public.process_entrega(p_entrega_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE rec record; v_exists boolean;
BEGIN
  IF public.get_feature_flag('auto_baixa_entrega') = false THEN RETURN; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.movimentacoes_estoque_produtos
    WHERE referencia_tipo='entrega' AND referencia_id=p_entrega_id
  ) INTO v_exists;
  IF v_exists THEN RETURN; END IF;

  FOR rec IN SELECT * FROM public.compute_entrega_itens(p_entrega_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
        rec.produto_id, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_entrega_id, 'baixa automática (entrega)'
  FROM public.compute_entrega_itens(p_entrega_id) t
  ON CONFLICT ON CONSTRAINT ux_mov_prod_ref DO NOTHING;
END;
$$;
