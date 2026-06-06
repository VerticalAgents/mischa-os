
-- 1) Tabela motivos_bonificacao
CREATE TABLE public.motivos_bonificacao (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.motivos_bonificacao TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.motivos_bonificacao_id_seq TO authenticated;
GRANT ALL ON public.motivos_bonificacao TO service_role;
GRANT ALL ON SEQUENCE public.motivos_bonificacao_id_seq TO service_role;

ALTER TABLE public.motivos_bonificacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read motivos_bonificacao"
  ON public.motivos_bonificacao FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Only admins can insert motivos_bonificacao"
  ON public.motivos_bonificacao FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update motivos_bonificacao"
  ON public.motivos_bonificacao FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete motivos_bonificacao"
  ON public.motivos_bonificacao FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed inicial
INSERT INTO public.motivos_bonificacao (nome) VALUES
  ('Cortesia'),
  ('Degustação'),
  ('Campanha');

-- 2) Tabela bonificacoes
CREATE TABLE public.bonificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL,
  historico_entrega_id UUID,
  produto_id UUID,
  produto_nome TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 1,
  motivo_id INTEGER,
  motivo_nome TEXT,
  data_bonificacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bonificacoes TO authenticated;
GRANT ALL ON public.bonificacoes TO service_role;

ALTER TABLE public.bonificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can read bonificacoes"
  ON public.bonificacoes FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can insert bonificacoes"
  ON public.bonificacoes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update bonificacoes"
  ON public.bonificacoes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete bonificacoes"
  ON public.bonificacoes FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Coluna bonificacoes_pendentes em agendamentos_clientes
ALTER TABLE public.agendamentos_clientes
  ADD COLUMN IF NOT EXISTS bonificacoes_pendentes JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 4) Atualizar process_entrega_safe para processar bonificações
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

  FOR rec IN SELECT * FROM public.compute_entrega_itens_v2(p_agendamento_id) LOOP
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
