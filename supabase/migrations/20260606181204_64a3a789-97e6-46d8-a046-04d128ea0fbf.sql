
-- 1) New function: aggregate regular delivery items + trocas + bonificações
CREATE OR REPLACE FUNCTION public.compute_entrega_itens_completo(p_agendamento_id uuid)
RETURNS TABLE(produto_id uuid, produto_nome text, quantidade integer)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_trocas jsonb;
  v_bonif jsonb;
BEGIN
  SELECT a.trocas_pendentes, a.bonificacoes_pendentes
  INTO v_trocas, v_bonif
  FROM public.agendamentos_clientes a
  WHERE a.id = p_agendamento_id;

  RETURN QUERY
  WITH base_itens AS (
    SELECT t.produto_id, t.produto_nome, t.quantidade
    FROM public.compute_entrega_itens_v2(p_agendamento_id) t
  ),
  trocas_itens AS (
    SELECT
      COALESCE(
        NULLIF(elem->>'produto_id','')::uuid,
        (SELECT pf.id FROM public.produtos_finais pf
          WHERE lower(pf.nome) = lower(COALESCE(elem->>'produto_nome', elem->>'produto', elem->>'nome',''))
            AND pf.ativo = true
          LIMIT 1)
      ) AS produto_id,
      COALESCE(elem->>'produto_nome', elem->>'produto', elem->>'nome') AS produto_nome,
      GREATEST(0, COALESCE((elem->>'quantidade')::int, 0)) AS quantidade
    FROM jsonb_array_elements(
      CASE WHEN v_trocas IS NOT NULL AND jsonb_typeof(v_trocas) = 'array'
        THEN v_trocas ELSE '[]'::jsonb END
    ) AS elem
  ),
  bonif_itens AS (
    SELECT
      COALESCE(
        NULLIF(elem->>'produto_id','')::uuid,
        (SELECT pf.id FROM public.produtos_finais pf
          WHERE lower(pf.nome) = lower(COALESCE(elem->>'produto_nome', elem->>'produto', elem->>'nome',''))
            AND pf.ativo = true
          LIMIT 1)
      ) AS produto_id,
      COALESCE(elem->>'produto_nome', elem->>'produto', elem->>'nome') AS produto_nome,
      GREATEST(0, COALESCE((elem->>'quantidade')::int, 0)) AS quantidade
    FROM jsonb_array_elements(
      CASE WHEN v_bonif IS NOT NULL AND jsonb_typeof(v_bonif) = 'array'
        THEN v_bonif ELSE '[]'::jsonb END
    ) AS elem
  ),
  unioned AS (
    SELECT * FROM base_itens
    UNION ALL
    SELECT ti.produto_id,
           COALESCE(pf.nome, ti.produto_nome) AS produto_nome,
           ti.quantidade
    FROM trocas_itens ti
    LEFT JOIN public.produtos_finais pf ON pf.id = ti.produto_id
    WHERE ti.produto_id IS NOT NULL AND ti.quantidade > 0
    UNION ALL
    SELECT bi.produto_id,
           COALESCE(pf.nome, bi.produto_nome) AS produto_nome,
           bi.quantidade
    FROM bonif_itens bi
    LEFT JOIN public.produtos_finais pf ON pf.id = bi.produto_id
    WHERE bi.produto_id IS NOT NULL AND bi.quantidade > 0
  )
  SELECT u.produto_id,
         MIN(u.produto_nome) AS produto_nome,
         SUM(u.quantidade)::int AS quantidade
  FROM unioned u
  WHERE u.produto_id IS NOT NULL AND u.quantidade > 0
  GROUP BY u.produto_id
  ORDER BY MIN(u.produto_nome);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.compute_entrega_itens_completo(uuid) TO anon, authenticated, service_role;

-- 2) Update process_entrega_safe (3-arg overload) to use the completo function for validation + movimentação
CREATE OR REPLACE FUNCTION public.process_entrega_safe(p_agendamento_id uuid, p_observacao text DEFAULT NULL::text, p_data_entrega timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_cliente_id uuid;
  v_cliente_nome text;
  v_qtd_total int;
  v_data_prevista date;
  v_periodicidade int;
  v_data_entrega_efetiva timestamp with time zone;
  v_gestaoclick_venda_id text;
  v_historico_id uuid;
  v_desabilitar_reagendamento boolean;
  v_observacoes_agendamento text;
  v_trocas_pendentes jsonb;
  v_bonificacoes_pendentes jsonb;
  v_observacao_completa text;
  v_trocas_resumo text;
  v_bonificacoes_resumo text;
  rec record;
  troca jsonb;
  bonif jsonb;
BEGIN
  v_data_entrega_efetiva := COALESCE(p_data_entrega, now());

  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao,
         COALESCE(c.periodicidade_padrao, 7), a.gestaoclick_venda_id,
         COALESCE(c.desabilitar_reagendamento, false),
         a.observacoes_agendamento, a.trocas_pendentes, a.bonificacoes_pendentes
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista,
       v_periodicidade, v_gestaoclick_venda_id, v_desabilitar_reagendamento,
       v_observacoes_agendamento, v_trocas_pendentes, v_bonificacoes_pendentes
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  -- Validação de saldo considerando itens regulares + trocas + bonificações
  FOR rec IN SELECT * FROM public.compute_entrega_itens_completo(p_agendamento_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
         rec.produto_nome, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Resumo das trocas
  v_trocas_resumo := NULL;
  IF v_trocas_pendentes IS NOT NULL
     AND jsonb_typeof(v_trocas_pendentes) = 'array'
     AND jsonb_array_length(v_trocas_pendentes) > 0 THEN
    SELECT string_agg(
      COALESCE((t->>'quantidade'),'1') || 'x ' ||
      COALESCE(t->>'produto_nome','(sem produto)') ||
      CASE WHEN COALESCE(t->>'motivo_nome','') <> '' THEN ' ('||(t->>'motivo_nome')||')' ELSE '' END,
      ', '
    )
    INTO v_trocas_resumo
    FROM jsonb_array_elements(v_trocas_pendentes) AS t
    WHERE COALESCE(t->>'produto_nome','') <> '';
  END IF;

  -- Resumo das bonificações
  v_bonificacoes_resumo := NULL;
  IF v_bonificacoes_pendentes IS NOT NULL
     AND jsonb_typeof(v_bonificacoes_pendentes) = 'array'
     AND jsonb_array_length(v_bonificacoes_pendentes) > 0 THEN
    SELECT string_agg(
      COALESCE((b->>'quantidade'),'1') || 'x ' ||
      COALESCE(b->>'produto_nome','(sem produto)') ||
      CASE WHEN COALESCE(b->>'motivo_nome','') <> '' THEN ' ('||(b->>'motivo_nome')||')' ELSE '' END,
      ', '
    )
    INTO v_bonificacoes_resumo
    FROM jsonb_array_elements(v_bonificacoes_pendentes) AS b
    WHERE COALESCE(b->>'produto_nome','') <> '';
  END IF;

  -- Observação completa
  v_observacao_completa := 'Entrega confirmada via expedição';
  IF p_observacao IS NOT NULL AND length(trim(p_observacao)) > 0 THEN
    v_observacao_completa := v_observacao_completa || ' | ' || p_observacao;
  END IF;
  IF v_observacoes_agendamento IS NOT NULL AND length(trim(v_observacoes_agendamento)) > 0 THEN
    v_observacao_completa := v_observacao_completa || ' | Obs. agendamento: ' || v_observacoes_agendamento;
  END IF;
  IF v_trocas_resumo IS NOT NULL AND length(trim(v_trocas_resumo)) > 0 THEN
    v_observacao_completa := v_observacao_completa || ' | Trocas: ' || v_trocas_resumo;
  END IF;
  IF v_bonificacoes_resumo IS NOT NULL AND length(trim(v_bonificacoes_resumo)) > 0 THEN
    v_observacao_completa := v_observacao_completa || ' | Bonificações: ' || v_bonificacoes_resumo;
  END IF;

  -- Movimentações de saída cobrindo regulares + trocas + bonificações
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT
    t.produto_id, t.quantidade, 'saida', v_data_entrega_efetiva, 'entrega', p_agendamento_id,
    'Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END
  FROM public.compute_entrega_itens_completo(p_agendamento_id) t;

  -- Histórico continua refletindo apenas itens regulares (para não duplicar consumo nas análises de giro)
  INSERT INTO public.historico_entregas (cliente_id, data, quantidade, tipo, observacao, itens, gestaoclick_venda_id)
  VALUES (
    v_cliente_id, v_data_entrega_efetiva, v_qtd_total, 'entrega',
    v_observacao_completa,
    (
      SELECT jsonb_agg(jsonb_build_object(
        'produto_id', t.produto_id,
        'quantidade', t.quantidade
      ))
      FROM public.compute_entrega_itens_v2(p_agendamento_id) t
    ),
    v_gestaoclick_venda_id
  )
  RETURNING id INTO v_historico_id;

  -- Trocas
  IF v_trocas_pendentes IS NOT NULL
     AND jsonb_typeof(v_trocas_pendentes) = 'array'
     AND jsonb_array_length(v_trocas_pendentes) > 0 THEN
    FOR troca IN SELECT * FROM jsonb_array_elements(v_trocas_pendentes) LOOP
      IF COALESCE(troca->>'produto_nome','') <> '' THEN
        INSERT INTO public.trocas (
          cliente_id, historico_entrega_id, produto_id, produto_nome,
          quantidade, motivo_id, motivo_nome, data_troca
        ) VALUES (
          v_cliente_id,
          v_historico_id,
          NULLIF(troca->>'produto_id','')::uuid,
          troca->>'produto_nome',
          COALESCE((troca->>'quantidade')::int, 1),
          NULLIF(troca->>'motivo_id','')::int,
          troca->>'motivo_nome',
          v_data_entrega_efetiva
        );
      END IF;
    END LOOP;
  END IF;

  -- Bonificações
  IF v_bonificacoes_pendentes IS NOT NULL
     AND jsonb_typeof(v_bonificacoes_pendentes) = 'array'
     AND jsonb_array_length(v_bonificacoes_pendentes) > 0 THEN
    FOR bonif IN SELECT * FROM jsonb_array_elements(v_bonificacoes_pendentes) LOOP
      IF COALESCE(bonif->>'produto_nome','') <> '' THEN
        INSERT INTO public.bonificacoes (
          cliente_id, historico_entrega_id, produto_id, produto_nome,
          quantidade, motivo_id, motivo_nome, data_bonificacao
        ) VALUES (
          v_cliente_id,
          v_historico_id,
          NULLIF(bonif->>'produto_id','')::uuid,
          bonif->>'produto_nome',
          COALESCE((bonif->>'quantidade')::int, 1),
          NULLIF(bonif->>'motivo_id','')::int,
          bonif->>'motivo_nome',
          v_data_entrega_efetiva
        );
      END IF;
    END LOOP;
  END IF;

  -- Reagendamento + limpeza
  IF v_desabilitar_reagendamento = true THEN
    UPDATE public.agendamentos_clientes
    SET
      data_proxima_reposicao = NULL,
      status_agendamento = 'Agendar',
      substatus_pedido = 'Agendado',
      gestaoclick_venda_id = NULL,
      gestaoclick_sincronizado_em = NULL,
      observacoes_agendamento = NULL,
      trocas_pendentes = '[]'::jsonb,
      bonificacoes_pendentes = '[]'::jsonb,
      updated_at = now()
    WHERE id = p_agendamento_id;
  ELSE
    UPDATE public.agendamentos_clientes
    SET
      data_proxima_reposicao = (v_data_entrega_efetiva::date + make_interval(days => v_periodicidade)),
      status_agendamento = 'Previsto',
      substatus_pedido = 'Agendado',
      gestaoclick_venda_id = NULL,
      gestaoclick_sincronizado_em = NULL,
      observacoes_agendamento = NULL,
      trocas_pendentes = '[]'::jsonb,
      bonificacoes_pendentes = '[]'::jsonb,
      updated_at = now()
    WHERE id = p_agendamento_id;
  END IF;
END;
$function$;
