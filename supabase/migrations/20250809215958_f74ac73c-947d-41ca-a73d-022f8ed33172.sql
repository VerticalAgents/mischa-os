
  -- 1) Unique constraint para evitar duplicidade de baixas por entrega/produto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ux_mov_prod_ref'
  ) THEN
    ALTER TABLE public.movimentacoes_estoque_produtos
    ADD CONSTRAINT ux_mov_prod_ref UNIQUE (referencia_tipo, referencia_id, produto_id);
  END IF;
END$$;

-- 2) Triggers para validar saldo e sincronizar estoque_atual
DO $$
BEGIN
  -- BEFORE INSERT -> previne saldo negativo
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mov_prod_prevent_negative'
  ) THEN
    CREATE TRIGGER trg_mov_prod_prevent_negative
    BEFORE INSERT ON public.movimentacoes_estoque_produtos
    FOR EACH ROW EXECUTE FUNCTION public.prevent_negative_produto();
  END IF;

  -- AFTER I/U/D -> sincroniza estoque do produto
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_mov_prod_sync'
  ) THEN
    CREATE TRIGGER trg_mov_prod_sync
    AFTER INSERT OR UPDATE OR DELETE ON public.movimentacoes_estoque_produtos
    FOR EACH ROW EXECUTE FUNCTION public.sync_estoque_produto();
  END IF;
END$$;

-- 3) Função para calcular itens de entrega de forma consistente no servidor
CREATE OR REPLACE FUNCTION public.compute_entrega_itens(p_agendamento_id uuid)
RETURNS TABLE (produto_id uuid, produto_nome text, quantidade integer)
LANGUAGE plpgsql
AS $$
DECLARE
  v_tipo text;
  v_qtd_total integer;
  v_itens jsonb;
BEGIN
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
            SELECT id 
            FROM public.produtos_finais 
            WHERE lower(nome) = lower(COALESCE(elem->>'produto', elem->>'nome')) 
            LIMIT 1
          )
        ) AS produto_id,
        COALESCE(elem->>'produto', elem->>'nome') AS produto_nome,
        GREATEST(0, COALESCE((elem->>'quantidade')::int, 0)) AS quantidade
      FROM jsonb_array_elements(v_itens) AS elem
    )
    SELECT i.produto_id, COALESCE(p.nome, i.produto_nome) as produto_nome, i.quantidade
    FROM itens i
    LEFT JOIN public.produtos_finais p ON p.id = i.produto_id
    WHERE i.produto_id IS NOT NULL AND i.quantidade > 0;
    RETURN;
  END IF;

  -- Tentar proporções padrão
  IF EXISTS (SELECT 1 FROM public.proporcoes_padrao pr WHERE pr.ativo = true) THEN
    RETURN QUERY
    WITH base AS (
      SELECT p.id AS produto_id, p.nome, pr.percentual::numeric
      FROM public.proporcoes_padrao pr
      JOIN public.produtos_finais p ON p.id = pr.produto_id
      WHERE pr.ativo = true
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
    SELECT produto_id, nome, quantidade FROM add_resto WHERE quantidade > 0;
    RETURN;
  END IF;

  -- Fallback: distribuição igual entre até 5 produtos ativos
  RETURN QUERY
  WITH lista AS (
    SELECT id AS produto_id, nome
    FROM public.produtos_finais
    WHERE ativo = true
    ORDER BY nome
    LIMIT 5
  ),
  n AS (SELECT COUNT(*)::int as cnt FROM lista),
  calc AS (
    SELECT 
      produto_id,
      nome,
      (v_qtd_total / GREATEST(1,(SELECT cnt FROM n)))::int AS base,
      ROW_NUMBER() OVER (ORDER BY nome) AS rn
    FROM lista
  ),
  resto AS (SELECT v_qtd_total % GREATEST(1,(SELECT cnt FROM n)) AS r)
  SELECT 
    produto_id,
    nome,
    base + CASE WHEN rn <= (SELECT r FROM resto) THEN 1 ELSE 0 END AS quantidade
  FROM calc
  WHERE base + CASE WHEN rn <= (SELECT r FROM resto) THEN 1 ELSE 0 END > 0;
END;
$$;

-- 4) Função de processamento seguro de entrega (baixa, histórico e reagendamento)
CREATE OR REPLACE FUNCTION public.process_entrega_safe(p_agendamento_id uuid, p_observacao text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente_id uuid;
  v_cliente_nome text;
  v_qtd_total int;
  v_data_prevista date;
  v_periodicidade int;
  v_exists boolean;
  rec record;
BEGIN
  -- Evitar duplicidade
  SELECT EXISTS (
    SELECT 1 FROM public.movimentacoes_estoque_produtos 
    WHERE referencia_tipo='entrega' AND referencia_id=p_agendamento_id
  ) INTO v_exists;
  IF v_exists THEN
    RAISE EXCEPTION 'Entrega % já processada', p_agendamento_id;
  END IF;

  -- Dados do agendamento e cliente
  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao, COALESCE(c.periodicidade_padrao, 7)
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista, v_periodicidade
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  -- Validar saldos
  FOR rec IN SELECT * FROM public.compute_entrega_itens(p_agendamento_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
         rec.produto_id, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Baixa no estoque (evita duplicidade pelo constraint)
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_agendamento_id,
    COALESCE('Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, 'Entrega confirmada')
  FROM public.compute_entrega_itens(p_agendamento_id) t
  ON CONFLICT ON CONSTRAINT ux_mov_prod_ref DO NOTHING;

  -- Histórico da entrega
  INSERT INTO public.historico_entregas (cliente_id, data, quantidade, tipo, observacao, itens)
  VALUES (
    v_cliente_id, now(), v_qtd_total, 'entrega',
    COALESCE('Entrega confirmada via expedição'||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, NULL),
    (
      SELECT jsonb_agg(jsonb_build_object(
        'produto_id', t.produto_id,
        'quantidade', t.quantidade
      ))
      FROM public.compute_entrega_itens(p_agendamento_id) t
    )
  );

  -- Reagendamento automático
  UPDATE public.agendamentos_clientes
  SET 
    data_proxima_reposicao = (current_date + make_interval(days => v_periodicidade)),
    status_agendamento = 'Previsto',
    substatus_pedido = 'Agendado',
    updated_at = now()
  WHERE id = p_agendamento_id;
END;
$$;
  