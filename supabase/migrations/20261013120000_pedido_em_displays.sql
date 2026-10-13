-- Pedido em displays (canal dos representantes da Imigração, 10/2026).
--
-- A regra vale por CLIENTE: clientes.modelo_pedido = 'displays'. Cliente criado por
-- representante marcado com modelo_pedido_padrao = 'displays' nasce assim sozinho.
-- Cliente 'padrao' (todos os de hoje) não muda em nada.
--
-- Para cliente de displays: pedido confirmado é múltiplo de 18, mínimo 36, com os
-- sabores abertos; o representante só lança e cancela pelas funções rep_*_pedido_displays,
-- que calculam o dia da entrega e travam depois que a fábrica separou.
-- As faixas de preço ficam em supabase/functions/_shared/pedidoDisplays.ts.

-- 1. Colunas ---------------------------------------------------------------

alter table public.clientes
  add column if not exists modelo_pedido text not null default 'padrao'
  check (modelo_pedido in ('padrao', 'displays'));

alter table public.representantes
  add column if not exists modelo_pedido_padrao text not null default 'padrao'
  check (modelo_pedido_padrao in ('padrao', 'displays'));

-- Como montar os displays: {"sortido": 2, "sabores": {"Brownie Avelã": 1}}.
-- itens_personalizados continua sendo a verdade dos brownies por sabor.
alter table public.agendamentos_clientes
  add column if not exists displays jsonb;

update public.representantes set modelo_pedido_padrao = 'displays' where id in (19, 20);

-- 2. Cliente nasce marcado, e o representante não desmarca --------------------

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
    -- Representante não troca o modelo do cliente nem religa o reagendamento.
    new.modelo_pedido := old.modelo_pedido;
    if old.modelo_pedido = 'displays' then
      new.desabilitar_reagendamento := old.desabilitar_reagendamento;
      new.periodicidade_padrao := old.periodicidade_padrao;
    end if;
  end if;

  -- Cliente de displays não tem pedido previsto sozinho: só existe o que foi lançado.
  if new.modelo_pedido = 'displays'
     and (tg_op = 'INSERT' or old.modelo_pedido is distinct from 'displays') then
    new.desabilitar_reagendamento := true;
    new.periodicidade_padrao := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_definir_modelo_pedido_do_cliente on public.clientes;
create trigger trigger_definir_modelo_pedido_do_cliente
  before insert or update on public.clientes
  for each row execute function public.definir_modelo_pedido_do_cliente();

-- 3. Trava do pedido confirmado -----------------------------------------------

create or replace function public.validar_pedido_displays()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  v_soma integer;
begin
  if new.status_agendamento is distinct from 'Agendado' then
    return new;
  end if;
  if not exists (
    select 1 from public.clientes c where c.id = new.cliente_id and c.modelo_pedido = 'displays'
  ) then
    return new;
  end if;

  if coalesce(new.quantidade_total, 0) < 36 then
    raise exception 'Pedido em displays: o mínimo é de 2 displays (36 brownies).';
  end if;
  if new.quantidade_total % 18 <> 0 then
    raise exception 'Pedido em displays: a quantidade tem que fechar em displays de 18 (veio %).', new.quantidade_total;
  end if;
  if new.tipo_pedido is distinct from 'Alterado'
     or new.itens_personalizados is null
     or jsonb_typeof(new.itens_personalizados) <> 'array' then
    raise exception 'Pedido em displays: os sabores precisam vir abertos no pedido.';
  end if;

  select coalesce(sum((item->>'quantidade')::integer), 0) into v_soma
  from jsonb_array_elements(new.itens_personalizados) as item;
  if v_soma <> new.quantidade_total then
    raise exception 'Pedido em displays: os sabores somam % e o pedido diz %.', v_soma, new.quantidade_total;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_validar_pedido_displays on public.agendamentos_clientes;
create trigger trigger_validar_pedido_displays
  before insert or update of status_agendamento, quantidade_total, itens_personalizados, tipo_pedido
  on public.agendamentos_clientes
  for each row execute function public.validar_pedido_displays();

-- 4. Dia da entrega -----------------------------------------------------------
-- Pedido depois das 14h conta como do dia seguinte. Daí: de sexta a terça entra
-- na quarta; de quarta e quinta, na sexta. Mesma regra de dataEntrega() no TypeScript.

create or replace function public.displays_data_entrega(p_agora timestamptz default now())
returns date
language plpgsql
stable
set search_path to 'public'
as $$
declare
  v_local timestamp := p_agora at time zone 'America/Sao_Paulo';
  v_base date := v_local::date;
  v_dia integer;
  v_alvo integer;
  v_faltam integer;
begin
  if extract(hour from v_local) >= 14 then
    v_base := v_base + 1;
  end if;
  v_dia := extract(dow from v_base)::integer;
  v_alvo := case when v_dia in (3, 4) then 5 else 3 end;
  v_faltam := (v_alvo - v_dia + 7) % 7;
  if v_faltam = 0 then
    v_faltam := 7;
  end if;
  return v_base + v_faltam;
end;
$$;

do $$
begin
  assert public.displays_data_entrega('2026-10-09 08:00-03') = date '2026-10-14', 'sexta -> quarta';
  assert public.displays_data_entrega('2026-10-10 15:00-03') = date '2026-10-14', 'sabado -> quarta';
  assert public.displays_data_entrega('2026-10-11 20:00-03') = date '2026-10-14', 'domingo -> quarta';
  assert public.displays_data_entrega('2026-10-12 18:00-03') = date '2026-10-14', 'segunda -> quarta';
  assert public.displays_data_entrega('2026-10-13 13:59-03') = date '2026-10-14', 'terca antes das 14h -> quarta';
  assert public.displays_data_entrega('2026-10-13 14:01-03') = date '2026-10-16', 'terca depois das 14h -> sexta';
  assert public.displays_data_entrega('2026-10-14 09:00-03') = date '2026-10-16', 'quarta -> sexta';
  assert public.displays_data_entrega('2026-10-14 19:00-03') = date '2026-10-16', 'quarta a noite -> sexta';
  assert public.displays_data_entrega('2026-10-15 13:59-03') = date '2026-10-16', 'quinta antes das 14h -> sexta';
  assert public.displays_data_entrega('2026-10-15 14:01-03') = date '2026-10-21', 'quinta depois das 14h -> quarta seguinte';
  assert public.displays_data_entrega('2026-10-16 10:00-03') = date '2026-10-21', 'sexta -> quarta seguinte';
end $$;

-- 5. O representante lança, altera e cancela por aqui --------------------------

create or replace function public.rep_lancar_pedido_displays(
  p_cliente_id uuid,
  p_displays jsonb,
  p_itens jsonb
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
       itens_personalizados, displays, data_proxima_reposicao, confirmado_em)
    values
      (p_cliente_id, 'Agendado', 'Agendado', 'Alterado', v_total, p_itens, p_displays, v_data, now());
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

-- Cancelar é voltar de confirmado para previsto, como já é na agenda da casa.
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
  set status_agendamento = 'Previsto', updated_at = now()
  where id = v_ag.id;
end;
$$;

revoke all on function public.rep_lancar_pedido_displays(uuid, jsonb, jsonb) from public, anon;
revoke all on function public.rep_cancelar_pedido_displays(uuid) from public, anon;
grant execute on function public.rep_lancar_pedido_displays(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.rep_cancelar_pedido_displays(uuid) to authenticated;
grant execute on function public.displays_data_entrega(timestamptz) to authenticated;

-- 6. Fecha os caminhos antigos para cliente de displays -------------------------
-- (cliente 'padrao' continua exatamente com as mesmas permissões)

drop policy if exists "Representante inserts own agendamentos" on public.agendamentos_clientes;
create policy "Representante inserts own agendamentos" on public.agendamentos_clientes
  for insert
  with check (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  );

drop policy if exists "Representante updates own agendamentos" on public.agendamentos_clientes;
create policy "Representante updates own agendamentos" on public.agendamentos_clientes
  for update
  using (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  )
  with check (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  );

drop policy if exists "Representante manages own precos_categoria_cliente" on public.precos_categoria_cliente;
drop policy if exists "Representante reads own precos_categoria_cliente" on public.precos_categoria_cliente;
drop policy if exists "Representante inserts own precos_categoria_cliente" on public.precos_categoria_cliente;
drop policy if exists "Representante updates own precos_categoria_cliente" on public.precos_categoria_cliente;
drop policy if exists "Representante deletes own precos_categoria_cliente" on public.precos_categoria_cliente;

create policy "Representante reads own precos_categoria_cliente" on public.precos_categoria_cliente
  for select
  using (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c where c.representante_id = public.get_my_representante_id()
    )
  );

create policy "Representante inserts own precos_categoria_cliente" on public.precos_categoria_cliente
  for insert
  with check (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  );

create policy "Representante updates own precos_categoria_cliente" on public.precos_categoria_cliente
  for update
  using (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  )
  with check (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  );

create policy "Representante deletes own precos_categoria_cliente" on public.precos_categoria_cliente
  for delete
  using (
    public.is_representante() and cliente_id in (
      select c.id from public.clientes c
      where c.representante_id = public.get_my_representante_id() and c.modelo_pedido <> 'displays'
    )
  );

-- A função antiga ignora as políticas (security definer): ganha a mesma recusa.
create or replace function public.representante_update_agendamento(
  p_agendamento_id uuid,
  p_status_agendamento text default null::text,
  p_data_proxima_reposicao date default null::date
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_rep_id integer;
  v_cliente_rep_id integer;
  v_modelo_pedido text;
BEGIN
  -- Verifica se o caller é representante
  v_rep_id := public.get_my_representante_id();
  IF v_rep_id IS NULL THEN
    RAISE EXCEPTION 'Acesso negado: apenas representantes podem usar esta função';
  END IF;

  -- Verifica se o agendamento pertence a um cliente do representante
  SELECT c.representante_id, c.modelo_pedido INTO v_cliente_rep_id, v_modelo_pedido
  FROM public.agendamentos_clientes a
  JOIN public.clientes c ON c.id = a.cliente_id
  WHERE a.id = p_agendamento_id;

  IF v_cliente_rep_id IS NULL THEN
    RAISE EXCEPTION 'Agendamento não encontrado';
  END IF;

  IF v_cliente_rep_id <> v_rep_id THEN
    RAISE EXCEPTION 'Acesso negado: este agendamento não pertence aos seus clientes';
  END IF;

  IF v_modelo_pedido = 'displays' THEN
    RAISE EXCEPTION 'Este cliente compra em displays: use a tela de Pedidos.';
  END IF;

  -- Atualiza apenas os campos permitidos (ignora os que vierem null)
  UPDATE public.agendamentos_clientes
  SET
    status_agendamento = COALESCE(p_status_agendamento, status_agendamento),
    data_proxima_reposicao = COALESCE(p_data_proxima_reposicao, data_proxima_reposicao),
    updated_at = now()
  WHERE id = p_agendamento_id;
END;
$function$;
