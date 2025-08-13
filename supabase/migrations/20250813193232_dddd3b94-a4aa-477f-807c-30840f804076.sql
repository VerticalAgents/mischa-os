
-- 1) Garantir índice/constraint único que impede baixa dupla (sem travar novas entregas)
CREATE UNIQUE INDEX IF NOT EXISTS ux_mov_prod_ref
ON public.movimentacoes_estoque_produtos(referencia_tipo, referencia_id);

-- 2) Criar função idempotente por execução
CREATE OR REPLACE FUNCTION public.process_entrega_idempotente(
  p_agendamento_id uuid,
  p_execucao_id uuid,
  p_observacao text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente_id uuid;
  v_cliente_nome text;
  v_qtd_total int;
  v_periodicidade int;
  rec record;
  v_inseriu boolean;
BEGIN
  -- Se essa execução já gerou baixa, no-op
  IF EXISTS (
    SELECT 1 FROM public.movimentacoes_estoque_produtos
    WHERE referencia_tipo = 'entrega'
      AND referencia_id   = p_execucao_id::text
  ) THEN
    RETURN;
  END IF;

  -- Carrega dados do agendamento/cliente
  SELECT a.cliente_id, c.nome, a.quantidade_total, COALESCE(c.periodicidade_padrao, 7)
  INTO v_cliente_id, v_cliente_nome, v_qtd_total, v_periodicidade
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  -- Valida saldos (reutiliza sua função de cálculo de itens)
  FOR rec IN SELECT * FROM public.compute_entrega_itens_v2(p_agendamento_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
        rec.produto_nome, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Baixa idempotente: referencia_id = p_execucao_id
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_execucao_id::text,
    'Entrega confirmada - '||v_cliente_nome||' | agendamento='||p_agendamento_id::text||
    CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t
  ON CONFLICT ON CONSTRAINT ux_mov_prod_ref DO NOTHING;

  GET DIAGNOSTICS v_inseriu = ROW_COUNT; -- true se inseriu alguma linha

  IF v_inseriu THEN
    -- Histórico
    INSERT INTO public.historico_entregas (cliente_id, data, quantidade, tipo, observacao, itens)
    VALUES (
      v_cliente_id, now(), v_qtd_total, 'entrega',
      COALESCE('Entrega confirmada via expedição'||
               CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, NULL),
      (
        SELECT jsonb_agg(jsonb_build_object('produto_id', t.produto_id, 'quantidade', t.quantidade))
        FROM public.compute_entrega_itens_v2(p_agendamento_id) t
      )
    );

    -- Reagendamento (mantém comportamento atual)
    UPDATE public.agendamentos_clientes
    SET 
      data_proxima_reposicao = (current_date + make_interval(days => v_periodicidade)),
      status_agendamento = 'Previsto',
      substatus_pedido = 'Agendado',
      updated_at = now()
    WHERE id = p_agendamento_id;
  END IF;
END;
$$;

-- Permissões (ajuste os papéis conforme o projeto)
GRANT EXECUTE ON FUNCTION public.process_entrega_idempotente(uuid,uuid,text)
TO authenticated, service_role, anon;
