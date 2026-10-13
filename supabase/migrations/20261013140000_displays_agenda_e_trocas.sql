-- Canal de displays: reagendamento religado e trocas no pedido (Lucca, 12/10/2026).
--
-- 1. Cliente de displays volta a ter pedido previsto depois da entrega (7 dias), para o
--    representante ver na agenda quem confirmar. A data do previsto é só indicativa: a
--    que vale é calculada quando ele confirma (displays_data_entrega).
-- 2. O representante lança trocas junto com o pedido. Bonificação continua só da casa.

create or replace function public.definir_modelo_pedido_do_cliente()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if tg_op = 'INSERT' then
    if new.representante_id is not null and exists (
      select 1 from public.representantes r
      where r.id = new.representante_id and r.modelo_pedido_padrao = 'displays'
    ) then
      new.modelo_pedido := 'displays';
    elsif public.is_representante() then
      new.modelo_pedido := 'padrao';
    end if;
  elsif public.is_representante() then
    -- Representante não troca o modelo do cliente nem mexe no reagendamento dele.
    new.modelo_pedido := old.modelo_pedido;
    if old.modelo_pedido = 'displays' then
      new.desabilitar_reagendamento := old.desabilitar_reagendamento;
      new.periodicidade_padrao := old.periodicidade_padrao;
    end if;
  end if;

  -- O ponto de venda do canal compra toda semana: depois da entrega volta como previsto.
  if new.modelo_pedido = 'displays'
     and (tg_op = 'INSERT' or old.modelo_pedido is distinct from 'displays') then
    new.desabilitar_reagendamento := false;
    new.periodicidade_padrao := 7;
  end if;

  return new;
end;
$$;

update public.clientes
set desabilitar_reagendamento = false, periodicidade_padrao = 7
where modelo_pedido = 'displays';

drop function if exists public.rep_lancar_pedido_displays(uuid, jsonb, jsonb);

create or replace function public.rep_lancar_pedido_displays(
  p_cliente_id uuid,
  p_displays jsonb,
  p_itens jsonb,
  p_trocas jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_rep_id integer := public.get_my_representante_id();
  v_cliente record;
  v_ag record;
  v_total integer;
  v_displays integer;
  v_invalido text;
  v_data date;
  v_alterado boolean := false;
begin
  if v_rep_id is null then
    raise exception 'Acesso negado: apenas representantes lançam pedido por aqui.';
  end if;

  select c.id, c.representante_id, c.modelo_pedido into v_cliente
  from public.clientes c where c.id = p_cliente_id;
  if v_cliente.id is null or v_cliente.representante_id is distinct from v_rep_id then
    raise exception 'Cliente não encontrado na sua carteira.';
  end if;
  if v_cliente.modelo_pedido <> 'displays' then
    raise exception 'Este cliente não compra em displays.';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'Pedido sem itens.';
  end if;

  select item->>'produto' into v_invalido
  from jsonb_array_elements(p_itens) as item
  where coalesce((item->>'quantidade')::integer, 0) <= 0
     or not exists (
       select 1 from public.produtos_finais p
       where p.nome = item->>'produto' and p.ativo = true and p.categoria_id = 1
     )
  limit 1;
  if found then
    raise exception 'Produto fora do canal ou com quantidade inválida: %', coalesce(v_invalido, '(sem nome)');
  end if;

  select sum((item->>'quantidade')::integer) into v_total
  from jsonb_array_elements(p_itens) as item;
  if v_total < 36 then
    raise exception 'O pedido mínimo é de 2 displays (36 brownies).';
  end if;
  if v_total % 18 <> 0 then
    raise exception 'O pedido tem que fechar em displays de 18.';
  end if;

  select coalesce((p_displays->>'sortido')::integer, 0)
       + coalesce((select sum(value::integer) from jsonb_each_text(coalesce(p_displays->'sabores', '{}'::jsonb))), 0)
  into v_displays;
  if v_displays * 18 <> v_total then
    raise exception 'Os displays não batem com os sabores do pedido.';
  end if;

  -- Trocas: fora do preço e do mínimo. null = não mexe nas que já estão no pedido.
  if p_trocas is not null then
    if jsonb_typeof(p_trocas) <> 'array' then
      raise exception 'Trocas em formato inválido.';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_trocas) as troca
      where coalesce(troca->>'produto_nome', '') = ''
         or coalesce((troca->>'quantidade')::integer, 0) <= 0
    ) then
      raise exception 'Cada troca precisa de sabor e quantidade.';
    end if;
  end if;

  select a.* into v_ag
  from public.agendamentos_clientes a
  where a.cliente_id = p_cliente_id
  order by a.created_at
  limit 1
  for update;

  if v_ag.id is null then
    v_data := public.displays_data_entrega(now());
    insert into public.agendamentos_clientes
      (cliente_id, status_agendamento, substatus_pedido, tipo_pedido, quantidade_total,
       itens_personalizados, displays, data_proxima_reposicao, confirmado_em, trocas_pendentes)
    values
      (p_cliente_id, 'Agendado', 'Agendado', 'Alterado', v_total, p_itens, p_displays, v_data, now(),
       coalesce(p_trocas, '[]'::jsonb));
  else
    if v_ag.substatus_pedido is distinct from 'Agendado' or v_ag.separado_em is not null then
      raise exception 'A fábrica já separou este pedido. Para mudar, fale com a Mischa''s.';
    end if;
    if v_ag.gestaoclick_venda_id is not null then
      raise exception 'A venda deste pedido já foi gerada. Para mudar, fale com a Mischa''s.';
    end if;

    if v_ag.status_agendamento = 'Agendado' and v_ag.data_proxima_reposicao is not null then
      -- Pedido já confirmado: muda o conteúdo e mantém o dia da entrega.
      v_data := v_ag.data_proxima_reposicao;
      v_alterado := true;
    else
      v_data := public.displays_data_entrega(now());
    end if;

    update public.agendamentos_clientes
    set status_agendamento = 'Agendado',
        substatus_pedido = 'Agendado',
        tipo_pedido = 'Alterado',
        quantidade_total = v_total,
        itens_personalizados = p_itens,
        displays = p_displays,
        data_proxima_reposicao = v_data,
        trocas_pendentes = coalesce(p_trocas, trocas_pendentes),
        updated_at = now()
    where id = v_ag.id;
  end if;

  return jsonb_build_object(
    'data_entrega', v_data,
    'quantidade_total', v_total,
    'displays', v_displays,
    'alterado', v_alterado
  );
end;
$$;

revoke all on function public.rep_lancar_pedido_displays(uuid, jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.rep_lancar_pedido_displays(uuid, jsonb, jsonb, jsonb) to authenticated;
