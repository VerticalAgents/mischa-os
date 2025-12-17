-- 1. Adicionar campo gestaoclick_venda_id em historico_entregas
ALTER TABLE public.historico_entregas 
ADD COLUMN IF NOT EXISTS gestaoclick_venda_id text;

-- 2. Criar índice para consultas por venda GC
CREATE INDEX IF NOT EXISTS idx_historico_entregas_gc_venda 
ON public.historico_entregas(gestaoclick_venda_id) 
WHERE gestaoclick_venda_id IS NOT NULL;

-- 3. Atualizar função process_entrega_safe para mover o ID da venda GC do agendamento para histórico
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
  rec record;
BEGIN
  -- Define a data de entrega: usa a fornecida ou now() como padrão
  v_data_entrega_efetiva := COALESCE(p_data_entrega, now());

  -- Dados do agendamento e cliente (incluindo gestaoclick_venda_id)
  SELECT a.cliente_id, c.nome, a.quantidade_total, a.data_proxima_reposicao, COALESCE(c.periodicidade_padrao, 7), a.gestaoclick_venda_id
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_data_prevista, v_periodicidade, v_gestaoclick_venda_id
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

  -- Histórico da entrega usando a data de entrega efetiva (COM gestaoclick_venda_id)
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

  -- Reagendamento automático E limpeza do gestaoclick_venda_id para permitir nova venda
  UPDATE public.agendamentos_clientes
  SET 
    data_proxima_reposicao = (v_data_entrega_efetiva::date + make_interval(days => v_periodicidade)),
    status_agendamento = 'Previsto',
    substatus_pedido = 'Agendado',
    gestaoclick_venda_id = NULL,
    gestaoclick_sincronizado_em = NULL,
    updated_at = now()
  WHERE id = p_agendamento_id;
END;
$function$;