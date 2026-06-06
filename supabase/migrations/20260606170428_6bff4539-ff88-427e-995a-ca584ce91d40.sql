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
  v_observacao_completa text;
  rec record;
  troca jsonb;
BEGIN
  v_data_entrega_efetiva := COALESCE(p_data_entrega, now());

  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao,
         COALESCE(c.periodicidade_padrao, 7), a.gestaoclick_venda_id,
         COALESCE(c.desabilitar_reagendamento, false),
         a.observacoes_agendamento, a.trocas_pendentes
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista,
       v_periodicidade, v_gestaoclick_venda_id, v_desabilitar_reagendamento,
       v_observacoes_agendamento, v_trocas_pendentes
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  FOR rec IN SELECT * FROM public.compute_entrega_itens_v2(p_agendamento_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
         rec.produto_nome, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Build full observation: include observacoes_agendamento if present
  v_observacao_completa := 'Entrega confirmada via expedição';
  IF p_observacao IS NOT NULL AND length(trim(p_observacao)) > 0 THEN
    v_observacao_completa := v_observacao_completa || ' | ' || p_observacao;
  END IF;
  IF v_observacoes_agendamento IS NOT NULL AND length(trim(v_observacoes_agendamento)) > 0 THEN
    v_observacao_completa := v_observacao_completa || ' | Obs. agendamento: ' || v_observacoes_agendamento;
  END IF;

  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT
    t.produto_id, t.quantidade, 'saida', v_data_entrega_efetiva, 'entrega', p_agendamento_id,
    'Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t;

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

  -- Registrar trocas pendentes na tabela trocas
  IF v_trocas_pendentes IS NOT NULL
     AND jsonb_typeof(v_trocas_pendentes) = 'array'
     AND jsonb_array_length(v_trocas_pendentes) > 0 THEN
    FOR troca IN SELECT * FROM jsonb_array_elements(v_trocas_pendentes) LOOP
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
    END LOOP;
  END IF;

  -- Reagendamento + limpeza de observações temporárias e trocas pendentes
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
      updated_at = now()
    WHERE id = p_agendamento_id;
  END IF;
END;
$function$;