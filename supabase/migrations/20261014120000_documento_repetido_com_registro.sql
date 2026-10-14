-- A trava do documento repetido passa a deixar rastro (Lucca, 14/10/2026).
--
-- Em 14/10 o Luis foi barrado ao cadastrar a Simionato, que não estava na base, e
-- não havia como saber qual número chegou à conferência. Agora o app chama esta
-- função no lugar da documento_ja_cadastrado: ela devolve o número que conferiu
-- (para a tela mostrar ao representante o que ele digitou) e, quando barra, anota
-- quem tentou, o que digitou e com qual cliente bateu.

create table if not exists public.bloqueios_documento (
  id bigint generated always as identity primary key,
  criado_em timestamptz not null default now(),
  user_id uuid default auth.uid(),
  documento_digitado text,
  documento_conferido text,
  cliente_encontrado_id uuid,
  cliente_encontrado_nome text
);

alter table public.bloqueios_documento enable row level security;

drop policy if exists "admin le bloqueios de documento" on public.bloqueios_documento;
create policy "admin le bloqueios de documento" on public.bloqueios_documento
  for select using (public.has_role(auth.uid(), 'admin'));

create or replace function public.conferir_documento_para_cadastro(p_documento text)
returns jsonb
language plpgsql
volatile
security definer
set search_path to 'public'
as $$
declare
  v_digitos text := regexp_replace(coalesce(p_documento, ''), '\D', '', 'g');
  v_cliente record;
begin
  if v_digitos = '' then
    return jsonb_build_object('ja_existe', false, 'documento', v_digitos);
  end if;

  select c.id, c.nome into v_cliente
  from public.clientes c
  where regexp_replace(coalesce(c.cnpj_cpf, ''), '\D', '', 'g') = v_digitos
  limit 1;

  if v_cliente.id is null then
    return jsonb_build_object('ja_existe', false, 'documento', v_digitos);
  end if;

  insert into public.bloqueios_documento
    (documento_digitado, documento_conferido, cliente_encontrado_id, cliente_encontrado_nome)
  values (p_documento, v_digitos, v_cliente.id, v_cliente.nome);

  -- O nome do cliente não volta para a tela: o representante não enxerga a carteira dos outros.
  return jsonb_build_object('ja_existe', true, 'documento', v_digitos);
end;
$$;

revoke all on function public.conferir_documento_para_cadastro(text) from public, anon;
grant execute on function public.conferir_documento_para_cadastro(text) to authenticated;
