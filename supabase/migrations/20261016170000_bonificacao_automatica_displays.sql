-- Bonificação automática de display (Lucca, 16/10/2026).
--
-- Cliente de lucro real (nasceu do Atacado Simionato) paga 17% de ICMS na revenda sem crédito
-- da nossa nota do Simples. Em vez de desconto no preço, a Mischa's bonifica 1 display a cada N
-- comprados. N mora no cadastro (clientes.bonificar_display_a_cada; nulo = não bonifica) e só
-- o admin mexe. O display bonificado é sortido, aberto pela composição de Configurações ›
-- Proporções, e vai para bonificacoes_pendentes: fica fora do preço por faixa, da venda no
-- Gestão Click e da comissão do representante, como toda bonificação.
-- As linhas automáticas levam o motivo 'Bonificação automática (lucro real)'; a bonificação
-- lançada à mão fica intocada. A regra espelhada da tela está em
-- supabase/functions/_shared/pedidoDisplays.ts (displaysBonificados): mudou numa, mude na outra.

alter table public.clientes add column if not exists bonificar_display_a_cada integer;
alter table public.clientes drop constraint if exists clientes_bonificar_display_a_cada_check;
alter table public.clientes add constraint clientes_bonificar_display_a_cada_check
  check (bonificar_display_a_cada is null or bonificar_display_a_cada >= 2);

create or replace function public.barrar_bonificacao_automatica_pelo_representante()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.is_representante()
     and new.bonificar_display_a_cada is distinct from
         (case when tg_op = 'INSERT' then null else old.bonificar_display_a_cada end) then
    raise exception 'Bonificação automática é decisão da Mischa''s.';
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_barrar_bonificacao_automatica on public.clientes;
create trigger trigger_barrar_bonificacao_automatica
  before insert or update of bonificar_display_a_cada on public.clientes
  for each row execute function public.barrar_bonificacao_automatica_pelo_representante();

insert into public.motivos_bonificacao (nome, ativo)
select 'Bonificação automática (lucro real)', true
where not exists (
  select 1 from public.motivos_bonificacao where nome = 'Bonificação automática (lucro real)'
);

-- Quantos displays o cliente ganha neste pedido.
create or replace function public.displays_bonificados_do_cliente(p_cliente_id uuid, p_displays integer)
returns integer
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(
    (select floor(greatest(p_displays, 0)::numeric / c.bonificar_display_a_cada)::integer
     from public.clientes c
     where c.id = p_cliente_id and c.bonificar_display_a_cada >= 2),
    0)
$$;

-- A composição do sortido salva pelo dono; torta ou ausente, a padrão de 15/10/2026 (5/5/4/3/1).
create or replace function public.composicao_sortido_vigente()
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  v_padrao jsonb := '{"Brownie Avelã":5,"Brownie Choco Duo":5,"Brownie Stikadinho":4,"Brownie Tradicional":3,"Brownie Meio Amargo":1}';
  v_c jsonb;
begin
  select cs.configuracoes->'sortido' into v_c
  from public.configuracoes_sistema cs
  where cs.modulo = 'displays' and cs.user_id = public.get_owner_id(auth.uid())
  limit 1;
  if v_c is null or jsonb_typeof(v_c) <> 'object' then
    return v_padrao;
  end if;
  if exists (select 1 from jsonb_each_text(v_c) e
             where not (v_padrao ? e.key) or e.value !~ '^[0-9]+$') then
    return v_padrao;
  end if;
  if (select sum(e.value::integer) from jsonb_each_text(v_c) e) <> 18 then
    return v_padrao;
  end if;
  return v_c;
end;
$$;

-- As linhas de N displays sortidos bonificados, no formato de bonificacoes_pendentes.
create or replace function public.itens_bonificacao_automatica(p_displays integer)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'produto_id', p.id,
           'produto_nome', e.key,
           'quantidade', e.value::integer * p_displays,
           'motivo_id', m.id,
           'motivo_nome', m.nome) order by e.value::integer desc, e.key), '[]'::jsonb)
  from jsonb_each_text(public.composicao_sortido_vigente()) e
  join public.produtos_finais p on p.nome = e.key and p.ativo and p.categoria_id = 1
  cross join lateral (
    select mb.id, mb.nome from public.motivos_bonificacao mb
    where mb.nome = 'Bonificação automática (lucro real)' limit 1
  ) m
  where coalesce(p_displays, 0) > 0 and e.value::integer > 0
$$;

-- Tira só as linhas automáticas.
create or replace function public.sem_bonificacao_automatica(p_itens jsonb)
returns jsonb
language sql
immutable
as $$
  select coalesce(jsonb_agg(i), '[]'::jsonb)
  from jsonb_array_elements(
         case when jsonb_typeof(p_itens) = 'array' then p_itens else '[]'::jsonb end) i
  where coalesce(i->>'motivo_nome', '') <> 'Bonificação automática (lucro real)'
$$;

revoke all on function public.displays_bonificados_do_cliente(uuid, integer) from public, anon;
revoke all on function public.composicao_sortido_vigente() from public, anon;
revoke all on function public.itens_bonificacao_automatica(integer) from public, anon;
grant execute on function public.displays_bonificados_do_cliente(uuid, integer) to authenticated;
grant execute on function public.composicao_sortido_vigente() to authenticated;
grant execute on function public.itens_bonificacao_automatica(integer) to authenticated;

drop function if exists public.rep_lancar_pedido_displays(uuid, jsonb, jsonb, jsonb, text);

create or replace function public.rep_lancar_pedido_displays(
  p_cliente_id uuid,
  p_displays jsonb,
  p_itens jsonb,
  p_trocas jsonb default null,
  p_observacoes text default null
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
  v_bonificados integer;
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
       itens_personalizados, displays, data_proxima_reposicao, confirmado_em, trocas_pendentes,
       observacoes_agendamento)
    values
      (p_cliente_id, 'Agendado', 'Agendado', 'Alterado', v_total, p_itens, p_displays, v_data, now(),
       coalesce(p_trocas, '[]'::jsonb), nullif(btrim(p_observacoes), ''));
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
        observacoes_agendamento = case when p_observacoes is null then observacoes_agendamento
                                       else nullif(btrim(p_observacoes), '') end,
        updated_at = now()
    where id = v_ag.id;
  end if;

  -- Bonificação automática (cliente de lucro real): refaz só as linhas automáticas e
  -- deixa intacta a bonificação lançada à mão pela Mischa's.
  v_bonificados := public.displays_bonificados_do_cliente(p_cliente_id, v_displays);
  update public.agendamentos_clientes a
  set bonificacoes_pendentes = public.sem_bonificacao_automatica(a.bonificacoes_pendentes)
                               || public.itens_bonificacao_automatica(v_bonificados)
  where a.id = (select a2.id from public.agendamentos_clientes a2
                where a2.cliente_id = p_cliente_id order by a2.created_at limit 1);

  return jsonb_build_object(
    'data_entrega', v_data,
    'quantidade_total', v_total,
    'displays', v_displays,
    'alterado', v_alterado,
    'displays_bonificados', v_bonificados
  );
end;
$$;

revoke all on function public.rep_lancar_pedido_displays(uuid, jsonb, jsonb, jsonb, text) from public, anon;
grant execute on function public.rep_lancar_pedido_displays(uuid, jsonb, jsonb, jsonb, text) to authenticated;

-- Cancelar o pedido tira junto a bonificação automática (a manual fica).
create or replace function public.rep_cancelar_pedido_displays(p_cliente_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_rep_id integer := public.get_my_representante_id();
  v_ag record;
begin
  if v_rep_id is null then
    raise exception 'Acesso negado: apenas representantes cancelam pedido por aqui.';
  end if;
  if not exists (
    select 1 from public.clientes c
    where c.id = p_cliente_id and c.representante_id = v_rep_id and c.modelo_pedido = 'displays'
  ) then
    raise exception 'Cliente não encontrado na sua carteira.';
  end if;

  select a.* into v_ag
  from public.agendamentos_clientes a
  where a.cliente_id = p_cliente_id
  order by a.created_at
  limit 1
  for update;

  if v_ag.id is null or v_ag.status_agendamento <> 'Agendado' then
    raise exception 'Este cliente não tem pedido confirmado para cancelar.';
  end if;
  if v_ag.substatus_pedido is distinct from 'Agendado' or v_ag.separado_em is not null then
    raise exception 'A fábrica já separou este pedido. Para cancelar, fale com a Mischa''s.';
  end if;
  if v_ag.gestaoclick_venda_id is not null then
    raise exception 'A venda deste pedido já foi gerada. Para cancelar, fale com a Mischa''s.';
  end if;

  update public.agendamentos_clientes
  set status_agendamento = 'Previsto',
      bonificacoes_pendentes = public.sem_bonificacao_automatica(bonificacoes_pendentes),
      updated_at = now()
  where id = v_ag.id;
end;
$$;
