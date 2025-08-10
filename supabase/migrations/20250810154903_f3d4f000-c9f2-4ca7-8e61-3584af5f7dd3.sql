
-- Create the new improved function for calculating delivery items
CREATE OR REPLACE FUNCTION public.compute_entrega_itens_v2(p_agendamento_id uuid)
 RETURNS TABLE(produto_id uuid, produto_nome text, quantidade integer)
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- Update the process_entrega_safe function to use the new calculation function
CREATE OR REPLACE FUNCTION public.process_entrega_safe(p_agendamento_id uuid, p_observacao text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

  -- Validar saldos usando a nova função
  FOR rec IN SELECT * FROM public.compute_entrega_itens_v2(p_agendamento_id) LOOP
    IF public.saldo_produto(rec.produto_id) < rec.quantidade THEN
      RAISE EXCEPTION 'Saldo insuficiente para produto % (necessário: %, disponível: %)',
         rec.produto_nome, rec.quantidade, public.saldo_produto(rec.produto_id);
    END IF;
  END LOOP;

  -- Baixa no estoque (evita duplicidade pelo constraint)
  INSERT INTO public.movimentacoes_estoque_produtos
    (produto_id, quantidade, tipo, data_movimentacao, referencia_tipo, referencia_id, observacao)
  SELECT 
    t.produto_id, t.quantidade, 'saida', now(), 'entrega', p_agendamento_id,
    COALESCE('Entrega confirmada - '||v_cliente_nome||CASE WHEN p_observacao IS NULL THEN '' ELSE ' | '||p_observacao END, 'Entrega confirmada')
  FROM public.compute_entrega_itens_v2(p_agendamento_id) t
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
$function$;
