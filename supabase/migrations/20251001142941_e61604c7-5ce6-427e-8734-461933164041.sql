-- Modificar a função process_entrega_safe para aceitar data de entrega opcional
CREATE OR REPLACE FUNCTION public.process_entrega_safe(
  p_agendamento_id uuid, 
  p_observacao text DEFAULT NULL::text,
  p_data_entrega timestamp with time zone DEFAULT NULL::timestamp with time zone
)
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
  rec record;
BEGIN
  -- Define a data de entrega: usa a fornecida ou now() como padrão
  v_data_entrega_efetiva := COALESCE(p_data_entrega, now());

  -- Dados do agendamento e cliente
  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao, COALESCE(c.periodicidade_padrao, 7)
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista, v_periodicidade
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  -- Validar saldos usando a nova função
  FOR rec IN SELECT * FROM public.compute_entrega_itens_v2(p_agendamento_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
         rec.produto_nome, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Baixa no estoque usando a data de entrega efetiva
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', v_data_entrega_efetiva, 'entrega', p_agendamento_id,
    COALESCE('Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, 'Entrega confirmada')
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t;

  -- Histórico da entrega usando a data de entrega efetiva
  INSERT INTO public.historico_entregas (cliente_id, data, quantidade, tipo, observacao, itens)
  VALUES (
    v_cliente_id, v_data_entrega_efetiva, v_qtd_total, 'entrega',
    COALESCE('Entrega confirmada via expedição'||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, NULL),
    (
      SELECT jsonb_agg(jsonb_build_object(
        'produto_id', t.produto_id,
        'quantidade', t.quantidade
      ))
      FROM public.compute_entrega_itens_v2(p_agendamento_id) t
    )
  );

  -- Reagendamento automático baseado na data de entrega efetiva
  UPDATE public.agendamentos_clientes
  SET 
    data_proxima_reposicao = (v_data_entrega_efetiva::date + make_interval(days => v_periodicidade)),
    status_agendamento = 'Previsto',
    substatus_pedido = 'Agendado',
    updated_at = now()
  WHERE id = p_agendamento_id;
END;
$function$;