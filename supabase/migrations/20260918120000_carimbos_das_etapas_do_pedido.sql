-- Quando cada etapa do pedido aconteceu.
--
-- Até aqui o sistema guardava só em QUE etapa o pedido está
-- (status_agendamento + substatus_pedido) e um updated_at que é sobrescrito a
-- cada mudança. Não dava para responder "quando esse pedido foi separado?".
--
-- Em vez de espalhar `separado_em = now()` por cada lugar que muda a etapa — a
-- tela de expedição, as ações em massa, a extensão do WhatsApp, o que o Lovable
-- gerar amanhã —, quem carimba é um gatilho. Assim o carimbo não depende de
-- ninguém lembrar, e nunca fica contando uma história diferente do estado.

alter table public.agendamentos_clientes
  add column if not exists confirmado_em timestamptz,
  add column if not exists separado_em timestamptz,
  add column if not exists despachado_em timestamptz;

comment on column public.agendamentos_clientes.confirmado_em is
  'Quando o agendamento passou para Agendado. Limpo ao voltar para Previsto/Agendar. Mantido pelo gatilho carimbar_etapas_do_pedido.';
comment on column public.agendamentos_clientes.separado_em is
  'Quando o pedido foi separado. Limpo ao desfazer a separação. Mantido pelo gatilho.';
comment on column public.agendamentos_clientes.despachado_em is
  'Quando o pedido foi despachado. Limpo ao desfazer o despacho. Mantido pelo gatilho.';

create or replace function public.carimbar_etapas_do_pedido()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  -- Previsto -> Agendado é a confirmação do cliente. Voltar atrás apaga o
  -- carimbo: senão o pedido do próximo ciclo nasceria "confirmado" sozinho,
  -- já que a linha é reaproveitada depois de cada entrega.
  if new.status_agendamento = 'Agendado' then
    if old.status_agendamento is distinct from 'Agendado' then
      new.confirmado_em := now();
    end if;
  else
    new.confirmado_em := null;
  end if;

  -- Separado e Despachado andam em cascata: desfazer a separação apaga os dois,
  -- desfazer o despacho apaga só o de cima.
  if new.substatus_pedido = 'Separado' then
    if old.substatus_pedido is distinct from 'Separado' then
      new.separado_em := coalesce(new.separado_em, now());
    end if;
    new.despachado_em := null;

  elsif new.substatus_pedido = 'Despachado' then
    if old.substatus_pedido is distinct from 'Despachado' then
      new.despachado_em := coalesce(new.despachado_em, now());
    end if;

  else
    -- 'Agendado' (ou qualquer outro): o pedido não está separado nem despachado.
    -- É também por aqui que passa o reset pós-entrega feito por
    -- process_entrega_safe, então o ciclo novo começa sem carimbo nenhum.
    new.separado_em := null;
    new.despachado_em := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_carimbar_etapas_do_pedido on public.agendamentos_clientes;

create trigger trigger_carimbar_etapas_do_pedido
  before update on public.agendamentos_clientes
  for each row
  execute function public.carimbar_etapas_do_pedido();

-- Estado atual vira ponto de partida: quem já está separado ou despachado ganha
-- o updated_at como carimbo aproximado, para a linha do tempo não nascer vazia.
-- É estimativa, e só desta vez.
update public.agendamentos_clientes
set separado_em = updated_at
where substatus_pedido in ('Separado', 'Despachado') and separado_em is null;

update public.agendamentos_clientes
set despachado_em = updated_at
where substatus_pedido = 'Despachado' and despachado_em is null;

update public.agendamentos_clientes
set confirmado_em = updated_at
where status_agendamento = 'Agendado' and confirmado_em is null;
