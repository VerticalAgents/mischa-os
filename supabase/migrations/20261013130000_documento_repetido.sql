-- Representante não cadastra CNPJ/CPF que já existe na base (Lucca, 12/10/2026).
--
-- É o que protege a carteira da casa: o representante não enxerga os clientes dos
-- outros, então a conferência tem que ser feita aqui, com os olhos do banco.
-- A trava NÃO vale para o admin: ele cadastra repetido se quiser.
-- Compara só os dígitos. Cliente sem documento não é protegido por ela.

create or replace function public.documento_ja_cadastrado(p_documento text, p_ignorar_cliente uuid default null)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select regexp_replace(coalesce(p_documento, ''), '\D', '', 'g') <> ''
     and exists (
       select 1 from public.clientes c
       where regexp_replace(coalesce(c.cnpj_cpf, ''), '\D', '', 'g')
             = regexp_replace(coalesce(p_documento, ''), '\D', '', 'g')
         and (p_ignorar_cliente is null or c.id <> p_ignorar_cliente)
     );
$$;

revoke all on function public.documento_ja_cadastrado(text, uuid) from public, anon;
grant execute on function public.documento_ja_cadastrado(text, uuid) to authenticated;

create or replace function public.barrar_documento_repetido()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if public.is_representante() and public.documento_ja_cadastrado(new.cnpj_cpf, new.id) then
    raise exception 'Este CNPJ/CPF já é cliente da Mischa''s. Fale com a Mischa''s antes de cadastrar.';
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_barrar_documento_repetido on public.clientes;
create trigger trigger_barrar_documento_repetido
  before insert or update of cnpj_cpf on public.clientes
  for each row execute function public.barrar_documento_repetido();
