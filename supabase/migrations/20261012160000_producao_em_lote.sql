-- Producao em lote: lancar e confirmar varios registros numa transacao so.
--
-- Antes, a confirmacao era feita pelo navegador em 5 a 30 gravacoes soltas
-- (src/hooks/useConfirmacaoProducao.ts): se a conexao caia no meio, ficava pela
-- metade. Aqui e tudo ou nada.
--
-- O estoque de insumos do Mischa OS nao e mantido (decisao do Lucca, 12/10/2026):
-- quando falta saldo, a funcao lanca sozinha a entrada do que falta, igual ao
-- "Repor e confirmar" da tela antiga. Nao da para simplesmente pular: o gatilho
-- prevent_negative_insumo recusa saida sem saldo.

create or replace function public.confirmar_producao_lote(p_ids uuid[])
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  r record;
  it record;
  v_receita uuid;
  v_itens int;
  v_consumo numeric;
  v_saldo numeric;
  v_falta numeric;
  v_quando timestamptz;
  v_confirmados int := 0;
  v_ja_confirmados int := 0;
  v_reposicoes int := 0;
begin
  if not public.is_owner_or_staff() then
    raise exception 'Sem permissão para confirmar produção';
  end if;

  for r in
    select *
      from historico_producao
     where id = any(p_ids)
     order by data_producao, created_at
       for update
  loop
    if coalesce(r.status, 'Registrado') <> 'Registrado' then
      v_ja_confirmados := v_ja_confirmados + 1;
      continue;
    end if;

    -- Ja tem entrada de estoque desta producao: so falta o status (confirmacao
    -- antiga que caiu no meio). Nao lanca de novo.
    if exists (
      select 1 from movimentacoes_estoque_produtos
       where referencia_tipo = 'producao' and referencia_id = r.id
    ) then
      update historico_producao
         set status = 'Confirmado', confirmado_em = now()
       where id = r.id;
      v_ja_confirmados := v_ja_confirmados + 1;
      continue;
    end if;

    if r.produto_id is null then
      raise exception 'Registro de % em % está sem produto vinculado',
        r.produto_nome, to_char(r.data_producao, 'DD/MM/YYYY');
    end if;

    select receita_id into v_receita
      from rendimentos_receita_produto
     where produto_id = r.produto_id
     limit 1;

    select count(*) into v_itens from itens_receita where receita_id = v_receita;

    if v_receita is null or v_itens = 0 then
      raise exception 'Produto "%" não tem receita com insumos. Nada foi gravado.', r.produto_nome;
    end if;

    -- Meio-dia do dia da producao (horario de Brasilia), e nao a hora do clique:
    -- lancamento atrasado entra no estoque no dia em que foi produzido.
    v_quando := (r.data_producao::text || ' 12:00:00-03')::timestamptz;

    for it in
      select ir.insumo_id, ir.quantidade, i.nome, i.unidade_medida
        from itens_receita ir
        join insumos i on i.id = ir.insumo_id
       where ir.receita_id = v_receita
    loop
      v_consumo := it.quantidade * r.formas_producidas;
      v_saldo := public.saldo_insumo(it.insumo_id);

      if v_saldo + 0.000001 < v_consumo then
        v_falta := round(v_consumo - v_saldo, 4);
        insert into movimentacoes_estoque_insumos
          (insumo_id, tipo, quantidade, data_movimentacao, referencia_tipo, referencia_id, observacao)
        values
          (it.insumo_id, 'entrada', v_falta + 0.01, v_quando, 'ajuste_producao', r.id,
           format('Reposição automática para confirmar produção (faltavam %s %s)', v_falta, it.unidade_medida));
        v_reposicoes := v_reposicoes + 1;
      end if;

      insert into movimentacoes_estoque_insumos
        (insumo_id, tipo, quantidade, data_movimentacao, referencia_tipo, referencia_id, observacao)
      values
        (it.insumo_id, 'saida', v_consumo, v_quando, 'producao', r.id,
         format('Consumo de receita - %s formas', r.formas_producidas));
    end loop;

    insert into movimentacoes_estoque_produtos
      (produto_id, tipo, quantidade, data_movimentacao, referencia_tipo, referencia_id, observacao)
    values
      (r.produto_id, 'entrada',
       floor(coalesce(r.unidades_previstas, r.unidades_calculadas, 0))::int,
       v_quando, 'producao', r.id,
       format('Produção confirmada - %s formas', r.formas_producidas));

    update historico_producao
       set status = 'Confirmado', confirmado_em = now()
     where id = r.id;

    v_confirmados := v_confirmados + 1;
  end loop;

  return jsonb_build_object(
    'confirmados', v_confirmados,
    'ja_confirmados', v_ja_confirmados,
    'reposicoes', v_reposicoes
  );
end;
$$;

-- p_itens: [{"data": "2026-10-12", "produto_id": "...", "formas": 12, "observacoes": "..."}]
-- Producao ja agendada (registro "Registrado" do mesmo produto no mesmo dia) e
-- atualizada em vez de duplicada.
create or replace function public.lancar_producao_lote(
  p_itens jsonb,
  p_confirmar boolean,
  p_origem text default 'Manual'
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  item jsonb;
  v_data date;
  v_produto uuid;
  v_formas int;
  v_obs text;
  v_nome text;
  v_rend numeric;
  v_unidades int;
  v_id uuid;
  v_ids uuid[] := '{}';
  v_criados int := 0;
  v_atualizados int := 0;
  v_confirmacao jsonb := null;
begin
  if not public.is_owner_or_staff() then
    raise exception 'Sem permissão para lançar produção';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Nenhuma produção para lançar';
  end if;

  -- Mesmo produto duas vezes no mesmo dia, no mesmo envio: a segunda linha
  -- sobrescreveria a primeira. Melhor recusar.
  if exists (
    select 1
      from jsonb_array_elements(p_itens) e
     group by e->>'data', e->>'produto_id'
    having count(*) > 1
  ) then
    raise exception 'O mesmo produto aparece duas vezes no mesmo dia';
  end if;

  for item in select * from jsonb_array_elements(p_itens)
  loop
    v_data := (item->>'data')::date;
    v_produto := (item->>'produto_id')::uuid;
    v_formas := (item->>'formas')::int;
    v_obs := nullif(btrim(coalesce(item->>'observacoes', '')), '');

    if v_data is null or v_produto is null then
      raise exception 'Item sem data ou sem produto';
    end if;
    if v_formas is null or v_formas <= 0 then
      raise exception 'Quantidade de formas inválida';
    end if;

    select nome into v_nome from produtos_finais where id = v_produto;
    if v_nome is null then
      raise exception 'Produto não encontrado';
    end if;

    select rendimento into v_rend
      from rendimentos_receita_produto
     where produto_id = v_produto
     limit 1;
    if v_rend is null or v_rend <= 0 then
      raise exception 'Produto "%" está sem rendimento. Defina em Precificação > Rendimentos.', v_nome;
    end if;

    v_unidades := floor(v_formas * v_rend)::int;

    select id into v_id
      from historico_producao
     where data_producao = v_data
       and produto_id = v_produto
       and coalesce(status, 'Registrado') = 'Registrado'
     order by created_at
     limit 1
       for update;

    if v_id is not null then
      update historico_producao
         set formas_producidas = v_formas,
             unidades_calculadas = v_unidades,
             unidades_previstas = v_unidades,
             rendimento_usado = v_rend,
             observacoes = coalesce(v_obs, observacoes)
       where id = v_id;
      v_atualizados := v_atualizados + 1;
    else
      insert into historico_producao
        (data_producao, produto_id, produto_nome, formas_producidas, unidades_calculadas,
         unidades_previstas, rendimento_usado, turno, origem, status, observacoes)
      values
        (v_data, v_produto, v_nome, v_formas, v_unidades,
         v_unidades, v_rend, 'Matutino', coalesce(p_origem, 'Manual'), 'Registrado', v_obs)
      returning id into v_id;
      v_criados := v_criados + 1;
    end if;

    v_ids := v_ids || v_id;
  end loop;

  if p_confirmar then
    v_confirmacao := public.confirmar_producao_lote(v_ids);
  end if;

  return jsonb_build_object(
    'ids', to_jsonb(v_ids),
    'criados', v_criados,
    'atualizados', v_atualizados,
    'confirmacao', v_confirmacao
  );
end;
$$;

revoke all on function public.confirmar_producao_lote(uuid[]) from public, anon;
revoke all on function public.lancar_producao_lote(jsonb, boolean, text) from public, anon;
grant execute on function public.confirmar_producao_lote(uuid[]) to authenticated;
grant execute on function public.lancar_producao_lote(jsonb, boolean, text) to authenticated;
