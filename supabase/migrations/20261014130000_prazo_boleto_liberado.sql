-- Prazo do boleto liberado cliente a cliente (Lucca, 14/10/2026).
--
-- No canal de displays o prazo sai da regra (7 dias; 14 a partir do 4º pedido pago
-- de 4 displays ou mais). Quando o Lucca libera um prazo para um cliente, este campo
-- vale no lugar da regra, desde o primeiro pedido. Nasceu da Simionato (14 dias).
-- Só o admin mexe: o representante não preenche nem altera.

alter table public.clientes add column if not exists prazo_boleto_liberado_dias integer;

create or replace function public.barrar_prazo_liberado_pelo_representante()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.is_representante()
     and new.prazo_boleto_liberado_dias is distinct from
         (case when tg_op = 'INSERT' then null else old.prazo_boleto_liberado_dias end) then
    raise exception 'Prazo do boleto liberado é decisão da Mischa''s.';
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_barrar_prazo_liberado on public.clientes;
create trigger trigger_barrar_prazo_liberado
  before insert or update of prazo_boleto_liberado_dias on public.clientes
  for each row execute function public.barrar_prazo_liberado_pelo_representante();

update public.clientes set prazo_boleto_liberado_dias = 14
where regexp_replace(coalesce(cnpj_cpf, ''), '\D', '', 'g') = '29112514000382';
