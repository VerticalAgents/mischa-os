
-- Adicionar coluna desabilitar_reagendamento
ALTER TABLE public.clientes ADD COLUMN desabilitar_reagendamento boolean DEFAULT false;

-- Recriar function process_entrega_safe (overload com 3 params) com condicional de reagendamento
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
  rec record;
BEGIN
  v_data_entrega_efetiva := COALESCE(p_data_entrega, now());

  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao, COALESCE(c.periodicidade_padrao, 7), a.gestaoclick_venda_id, COALESCE(c.desabilitar_reagendamento, false)
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista, v_periodicidade, v_gestaoclick_venda_id, v_desabilitar_reagendamento
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

  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', v_data_entrega_efetiva, 'entrega', p_agendamento_id,
    COALESCE('Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, 'Entrega confirmada')
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t;

  INSERT INTO public.historico_entregas (cliente_id, data, quantidade, tipo, observacao, itens, gestaoclick_venda_id)
  VALUES (
    v_cliente_id, v_data_entrega_efetiva, v_qtd_total, 'entrega',
    COALESCE('Entrega confirmada via expedição'||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, NULL),
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

  -- Reagendamento: verificar preferencia do cliente
  IF v_desabilitar_reagendamento = true THEN
    UPDATE public.agendamentos_clientes
    SET 
      data_proxima_reposicao = NULL,
      status_agendamento = 'Agendar',
      substatus_pedido = 'Agendado',
      gestaoclick_venda_id = NULL,
      gestaoclick_sincronizado_em = NULL,
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
      updated_at = now()
    WHERE id = p_agendamento_id;
  END IF;
END;
$function$;

-- Recriar function process_entrega_safe (overload com 2 params) com condicional de reagendamento
CREATE OR REPLACE FUNCTION public.process_entrega_safe(p_agendamento_id uuid, p_observacao text DEFAULT NULL::text)
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
  v_desabilitar_reagendamento boolean;
  rec record;
BEGIN
  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao, COALESCE(c.periodicidade_padrao, 7), COALESCE(c.desabilitar_reagendamento, false)
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista, v_periodicidade, v_desabilitar_reagendamento
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

  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_agendamento_id,
    COALESCE('Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, 'Entrega confirmada')
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t;

  INSERT INTO public.historico_entregas (cliente_id, data, quantidade, tipo, observacao, itens)
  VALUES (
    v_cliente_id, now(), v_qtd_total, 'entrega',
    COALESCE('Entrega confirmada via expedição'||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, NULL),
    (
      SELECT jsonb_agg(jsonb_build_object(
        'produto_id', t.produto_id,
        'quantidade', t.quantidade
      ))
      FROM public.compute_entrega_itens_v2(p_agendamento_id) t
    )
  );

  -- Reagendamento: verificar preferencia do cliente
  IF v_desabilitar_reagendamento = true THEN
    UPDATE public.agendamentos_clientes
    SET 
      data_proxima_reposicao = NULL,
      status_agendamento = 'Agendar',
      substatus_pedido = 'Agendado',
      updated_at = now()
    WHERE id = p_agendamento_id;
  ELSE
    UPDATE public.agendamentos_clientes
    SET 
      data_proxima_reposicao = (current_date + make_interval(days => v_periodicidade)),
      status_agendamento = 'Previsto',
      substatus_pedido = 'Agendado',
      updated_at = now()
    WHERE id = p_agendamento_id;
  END IF;
END;
$function$;
