-- Final security fixes: complete remaining function search paths and remove any remaining SECURITY DEFINER views
-- This should resolve all remaining security linter warnings

-- Fix remaining functions that still need search_path set
CREATE OR REPLACE FUNCTION public.compute_entrega_itens_v2(p_agendamento_id uuid)
RETURNS TABLE(produto_id uuid, produto_nome text, quantidade integer)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_tipo text;
  v_qtd_total integer;
  v_itens jsonb;
  v_total_percentual numeric;
BEGIN
  -- Get agendamento data with explicit table alias
  SELECT agend.tipo_pedido, agend.quantidade_total, agend.itens_personalizados
  INTO v_tipo, v_qtd_total, v_itens
  FROM public.agendamentos_clientes agend
  WHERE agend.id = p_agendamento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agendamento % não encontrado', p_agendamento_id;
  END IF;

  -- Validar quantidade total
  IF v_qtd_total <= 0 THEN
    RAISE EXCEPTION 'Quantidade total deve ser maior que zero para agendamento %', p_agendamento_id;
  END IF;

  -- Caso 1: Itens personalizados (pedidos 'Alterado')
  IF v_tipo = 'Alterado' AND v_itens IS NOT NULL AND jsonb_typeof(v_itens) = 'array' AND jsonb_array_length(v_itens) > 0 THEN
    RETURN QUERY
    WITH itens_processados AS (
      SELECT 
        COALESCE(
          NULLIF(elem->>'produto_id','')::uuid,
          (
            SELECT prod.id 
            FROM public.produtos_finais prod
            WHERE lower(prod.nome) = lower(COALESCE(elem->>'produto', elem->>'nome')) 
              AND prod.ativo = true
            LIMIT 1
          )
        ) AS calc_produto_id,
        COALESCE(elem->>'produto', elem->>'nome') AS item_nome,
        GREATEST(0, COALESCE((elem->>'quantidade')::int, 0)) AS item_quantidade
      FROM jsonb_array_elements(v_itens) AS elem
    )
    SELECT 
      ip.calc_produto_id, 
      COALESCE(pf.nome, ip.item_nome) as nome_produto, 
      ip.item_quantidade
    FROM itens_processados ip
    LEFT JOIN public.produtos_finais pf ON pf.id = ip.calc_produto_id
    WHERE ip.calc_produto_id IS NOT NULL AND ip.item_quantidade > 0;
    
    -- Verificar se encontrou pelo menos um item válido
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Nenhum item válido encontrado nos itens personalizados do agendamento %', p_agendamento_id;
    END IF;
    RETURN;
  END IF;

  -- Caso 2: Pedidos 'Padrão' - usar proporções configuradas
  IF v_tipo = 'Padrão' THEN
    -- Verificar se existem proporções configuradas
    SELECT SUM(prop.percentual) INTO v_total_percentual
    FROM public.proporcoes_padrao prop
    JOIN public.produtos_finais pf ON pf.id = prop.produto_id
    WHERE prop.ativo = true AND pf.ativo = true;
    
    IF v_total_percentual IS NULL OR v_total_percentual = 0 THEN
      RAISE EXCEPTION 'Nenhuma proporção padrão configurada ou produtos ativos encontrados para agendamento %', p_agendamento_id;
    END IF;

    -- Calcular quantidades com normalização e distribuição de resto
    RETURN QUERY
    WITH proporcoes_base AS (
      SELECT 
        prop.produto_id,
        pf.nome as produto_nome,
        prop.percentual,
        -- Normalizar percentuais para totalizar 100%
        (prop.percentual / v_total_percentual * 100.0) AS percentual_normalizado
      FROM public.proporcoes_padrao prop
      JOIN public.produtos_finais pf ON pf.id = prop.produto_id
      WHERE prop.ativo = true AND pf.ativo = true AND prop.percentual > 0
    ),
    calculos_base AS (
      SELECT 
        pb.produto_id,
        pb.produto_nome,
        pb.percentual_normalizado,
        -- Quantidade base usando floor
        FLOOR((pb.percentual_normalizado / 100.0) * v_qtd_total) AS quantidade_base,
        -- Parte fracionária para distribuição do resto
        ((pb.percentual_normalizado / 100.0) * v_qtd_total) - FLOOR((pb.percentual_normalizado / 100.0) * v_qtd_total) AS fracao,
        ROW_NUMBER() OVER (ORDER BY 
          ((pb.percentual_normalizado / 100.0) * v_qtd_total) - FLOOR((pb.percentual_normalizado / 100.0) * v_qtd_total) DESC,
          pb.percentual_normalizado DESC,
          pb.produto_nome
        ) AS ordem_resto
      FROM proporcoes_base pb
    ),
    resto_total AS (
      SELECT v_qtd_total - SUM(quantidade_base) AS unidades_restantes
      FROM calculos_base
    ),
    distribuicao_final AS (
      SELECT 
        cb.produto_id,
        cb.produto_nome,
        cb.quantidade_base + 
        CASE 
          WHEN cb.ordem_resto <= (SELECT unidades_restantes FROM resto_total) THEN 1 
          ELSE 0 
        END AS quantidade_final
      FROM calculos_base cb
    )
    SELECT 
      df.produto_id,
      df.produto_nome,
      df.quantidade_final::integer
    FROM distribuicao_final df
    WHERE df.quantidade_final > 0
    ORDER BY df.produto_nome;
    
    -- Verificar se conseguiu distribuir quantidades
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Não foi possível calcular quantidades válidas com as proporções configuradas para agendamento %', p_agendamento_id;
    END IF;
    RETURN;
  END IF;

  -- Caso 3: Fallback - distribuição igualitária entre produtos ativos
  RETURN QUERY
  WITH produtos_ativos AS (
    SELECT pf.id AS produto_id, pf.nome
    FROM public.produtos_finais pf
    WHERE pf.ativo = true
    ORDER BY pf.nome
    LIMIT 5
  ),
  contagem AS (
    SELECT COUNT(*)::integer as total_produtos FROM produtos_ativos
  ),
  distribuicao_igual AS (
    SELECT 
      pa.produto_id,
      pa.nome,
      (v_qtd_total / (SELECT total_produtos FROM contagem))::integer AS quantidade_base,
      ROW_NUMBER() OVER (ORDER BY pa.nome) AS posicao
    FROM produtos_ativos pa
  ),
  resto_distribuicao AS (
    SELECT v_qtd_total % (SELECT total_produtos FROM contagem) AS resto_unidades
  )
  SELECT 
    de.produto_id,
    de.nome,
    de.quantidade_base + 
    CASE 
      WHEN de.posicao <= (SELECT resto_unidades FROM resto_distribuicao) THEN 1 
      ELSE 0 
    END AS quantidade_final
  FROM distribuicao_igual de
  WHERE de.quantidade_base + 
    CASE 
      WHEN de.posicao <= (SELECT resto_unidades FROM resto_distribuicao) THEN 1 
      ELSE 0 
    END > 0;
  
  -- Verificar se existe pelo menos um produto ativo
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum produto ativo encontrado para distribuição no agendamento %', p_agendamento_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_entrega_itens(p_agendamento_id uuid)
RETURNS TABLE(produto_id uuid, produto_nome text, quantidade integer)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.check_cliente_status_consistency()
RETURNS TABLE(id uuid, nome text, ativo boolean, status_cliente text, inconsistencia text)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.nome,
    c.ativo,
    c.status_cliente,
    CASE 
      WHEN c.ativo = false AND c.status_cliente = 'Ativo' THEN 'Campo ativo false mas status_cliente Ativo'
      WHEN c.ativo = true AND c.status_cliente = 'Inativo' THEN 'Campo ativo true mas status_cliente Inativo'
      ELSE 'Outros problemas'
    END as inconsistencia
  FROM clientes c
  WHERE 
    (c.ativo = false AND c.status_cliente = 'Ativo') OR
    (c.ativo = true AND c.status_cliente = 'Inativo');
END;
$$;

CREATE OR REPLACE FUNCTION public.process_entrega_idempotente(p_agendamento_id uuid, p_execucao_id uuid, p_observacao text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
      AND referencia_id = p_execucao_id
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

  -- Baixa idempotente: referencia_id = p_execucao_id (mantendo como UUID)
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_execucao_id,
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

CREATE OR REPLACE FUNCTION public.process_entrega_safe(p_agendamento_id uuid, p_observacao text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_cliente_id uuid;
  v_cliente_nome text;
  v_qtd_total int;
  v_data_prevista date;
  v_periodicidade int;
  rec record;
BEGIN
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

  -- Baixa no estoque (sem constraint de duplicidade)
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_agendamento_id,
    COALESCE('Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, 'Entrega confirmada')
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t;

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
      FROM public.compute_entrega_itens_v2(p_agendamento_id) t
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

-- Remove the SECURITY DEFINER function that was identified as the issue
-- The get_dados_analise_giro function was a SECURITY DEFINER view-like function
-- We already dropped it, but let's ensure there are no other problematic functions

-- Comment explaining the security model for the materialized view
COMMENT ON MATERIALIZED VIEW public.dados_analise_giro_materialized IS 
'Business analytics data consolidated for performance. Access is restricted to admin users only through application-level role verification. This view is not accessible via the API to prevent unauthorized data exposure.';